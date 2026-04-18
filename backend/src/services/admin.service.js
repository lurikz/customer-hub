import bcrypt from 'bcryptjs';
import * as users from '../repositories/users.repo.js';
import { httpError } from '../middleware/errorHandler.js';

export async function listUsers(tenantId) {
  return users.listByTenant(tenantId);
}

export async function createUser(actor, { name, email, password, role }) {
  // Apenas super_admin pode criar admin ou super_admin
  if ((role === 'admin' || role === 'super_admin') && actor.role !== 'super_admin') {
    throw httpError(403, 'Apenas super_admin pode criar admin ou super_admin');
  }

  const existing = await users.findByEmail(email);
  if (existing) throw httpError(409, 'E-mail já cadastrado');

  const passwordHash = await bcrypt.hash(password, 12);
  return users.createUser({
    tenantId: actor.tenantId,
    name,
    email,
    passwordHash,
    role,
  });
}

export async function updateRole(actor, userId, role) {
  if (userId === actor.userId) {
    throw httpError(400, 'Não é possível alterar o próprio papel');
  }
  if ((role === 'admin' || role === 'super_admin') && actor.role !== 'super_admin') {
    throw httpError(403, 'Apenas super_admin pode atribuir admin ou super_admin');
  }
  const updated = await users.updateRole(userId, actor.tenantId, role);
  if (!updated) throw httpError(404, 'Usuário não encontrado');
  return updated;
}

export async function deleteUser(actor, userId) {
  if (userId === actor.userId) {
    throw httpError(400, 'Não é possível excluir a si mesmo');
  }
  const ok = await users.deleteById(userId, actor.tenantId);
  if (!ok) throw httpError(404, 'Usuário não encontrado');
  return { ok: true };
}
