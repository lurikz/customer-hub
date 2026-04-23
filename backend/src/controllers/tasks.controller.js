import * as service from '../services/tasks.service.js';
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
    const updated = await service.updateTask(req.auth.tenantId, id, data);
    if (!updated) throw httpError(404, 'Tarefa não encontrada');
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