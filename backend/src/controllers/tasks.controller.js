import * as service from '../services/tasks.service.js';
import * as taskLogsRepo from '../repositories/taskLogs.repo.js';
import * as recordsRepo from '../repositories/records.repo.js';

export async function complete(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, description, result, notes } = req.body;

    if (!['concluído', 'ganho'].includes(status)) {
      throw httpError(400, 'Status inválido para conclusão');
    }

    if (!description) {
      throw httpError(400, 'O campo "O que foi feito?" é obrigatório');
    }

    const task = await service.getTask(req.auth.tenantId, id);
    if (!task) throw httpError(404, 'Tarefa não encontrada');

    // 1. Atualizar status da tarefa
    const updatedTask = await service.updateTask(req.auth.tenantId, id, { status });

    // 2. Criar log de execução
    await taskLogsRepo.insert(req.auth.tenantId, {
      task_id: id,
      user_id: req.auth.userId,
      description,
      result,
      notes,
    });

    // 3. Se tiver cliente, criar registro no histórico (verificando se já existe)
    if (task.client_id) {
      const { rows: existing } = await query(
        `SELECT id FROM client_records WHERE tenant_id = $1 AND task_id = $2`,
        [req.auth.tenantId, id]
      );

      if (existing.length === 0) {
        await recordsRepo.insert(req.auth.tenantId, req.auth.userId, task.client_id, {
          type: 'Tarefa concluída',
          description: description,
          task_id: id,
          task_title: task.title,
        });
      }
    }

    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'task.complete',
      entity: 'task',
      entityId: id,
      ip: req.ip,
      metadata: { status },
    });

    res.json(updatedTask);
  } catch (e) {
    next(e);
  }
}
import * as audit from '../repositories/audit.repo.js';
import {
  createTaskSchema,
  updateTaskSchema,
  idParamSchema,
  listFiltersSchema,
} from '../validators/task.schema.js';
import { httpError } from '../middleware/errorHandler.js';

export async function list(req, res, next) {
  try {
    const filters = listFiltersSchema.parse(req.query);
    const tasks = await service.listTasks(req.auth.tenantId, filters);
    res.json(tasks);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const task = await service.getTask(req.auth.tenantId, id);
    if (!task) throw httpError(404, 'Tarefa não encontrada');
    res.json(task);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const data = createTaskSchema.parse(req.body);
    const created = await service.createTask(req.auth.tenantId, data);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'task.create',
      entity: 'task',
      entityId: created.id,
      ip: req.ip,
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = updateTaskSchema.parse(req.body);
    
    const { execution_description, ...taskData } = data;

    // 1. Atualizar tarefa
    const updated = await service.updateTask(req.auth.tenantId, id, taskData);
    if (!updated) throw httpError(404, 'Tarefa não encontrada');

    // 2. Se houver alteração na descrição da execução
    if (execution_description) {
      await taskLogsRepo.update(req.auth.tenantId, id, execution_description);

      // Sincronizar com o histórico do cliente
      await query(
        `UPDATE client_records 
         SET description = $3
         WHERE tenant_id = $1 AND task_id = $2`,
        [req.auth.tenantId, id, execution_description]
      );
    }

    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'task.update',
      entity: 'task',
      entityId: id,
      ip: req.ip,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const ok = await service.deleteTask(req.auth.tenantId, id);
    if (!ok) throw httpError(404, 'Tarefa não encontrada');
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'task.delete',
      entity: 'task',
      entityId: id,
      ip: req.ip,
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function listByClient(req, res, next) {
  try {
    const { id: clientId } = idParamSchema.parse(req.params);
    const tasks = await service.listTasksByClient(req.auth.tenantId, clientId);
    res.json(tasks);
  } catch (e) {
    next(e);
  }
}