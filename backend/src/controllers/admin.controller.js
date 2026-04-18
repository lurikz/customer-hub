import * as service from '../services/admin.service.js';
import { createUserSchema, updateRoleSchema } from '../validators/admin.schema.js';
import * as audit from '../repositories/audit.repo.js';

export async function listUsers(req, res, next) {
  try {
    const list = await service.listUsers(req.auth.tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
}

export async function createUser(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await service.createUser(req.auth, data);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'admin.user_created',
      entity: 'user',
      entity_id: user.id,
      ip: req.ip,
      metadata: { email: user.email, role: user.role },
    });
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
}

export async function updateRole(req, res, next) {
  try {
    const { role } = updateRoleSchema.parse(req.body);
    const user = await service.updateRole(req.auth, req.params.id, role);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'admin.role_updated',
      entity: 'user',
      entity_id: user.id,
      ip: req.ip,
      metadata: { role },
    });
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await service.deleteUser(req.auth, req.params.id);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'admin.user_deleted',
      entity: 'user',
      entity_id: req.params.id,
      ip: req.ip,
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
