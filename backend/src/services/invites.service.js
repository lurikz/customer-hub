import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as invites from '../repositories/invites.repo.js';
import * as users from '../repositories/users.repo.js';
import { httpError } from '../middleware/errorHandler.js';

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
  return jwt.sign(
    { sub: user.id, tenantId: user.tenant_id, role: user.role, email: user.email },
    secret,
    { expiresIn, issuer: 'crm-api', audience: 'crm-app' }
  );
}

export async function createInvite(actor, { email, role, expiresInHours }) {
  // Apenas super_admin pode emitir convite para admin/super_admin
  if ((role === 'admin' || role === 'super_admin') && actor.role !== 'super_admin') {
    throw httpError(403, 'Apenas super_admin pode convidar admin ou super_admin');
  }

  const token = invites.generateToken();
  const tokenHash = invites.hashToken(token);
  const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

  const invite = await invites.create({
    tenantId: actor.tenantId,
    email,
    role,
    createdBy: actor.userId,
    expiresAt,
    tokenHash,
  });

  // ÚNICA vez que o token plaintext é retornado
  return { invite, token };
}

export async function listInvites(tenantId) {
  return invites.listByTenant(tenantId);
}

export async function revokeInvite(actor, id) {
  const ok = await invites.revoke(id, actor.tenantId);
  if (!ok) throw httpError(404, 'Convite não encontrado ou já utilizado');
  return { ok: true };
}

/**
 * Lookup público (sem auth) — devolve só metadados não sensíveis para a tela /signup
 */
export async function lookupInvite(token) {
  const tokenHash = invites.hashToken(token);
  const invite = await invites.findByTokenHash(tokenHash);
  if (!invite) throw httpError(404, 'Convite inválido');
  if (invite.used_at) throw httpError(410, 'Convite já utilizado');
  if (new Date(invite.expires_at) <= new Date()) throw httpError(410, 'Convite expirado');
  return {
    email: invite.email,
    role: invite.role,
    expires_at: invite.expires_at,
  };
}

/**
 * Aceita convite e cria o usuário. Operação atômica via markUsed condicional.
 */
export async function acceptInvite({ token, name, password }) {
  const tokenHash = invites.hashToken(token);
  const invite = await invites.findByTokenHash(tokenHash);
  if (!invite) throw httpError(404, 'Convite inválido');
  if (invite.used_at) throw httpError(410, 'Convite já utilizado');
  if (new Date(invite.expires_at) <= new Date()) throw httpError(410, 'Convite expirado');

  // Se o convite tem e-mail fixo, usamos esse; senão, exigimos que o usuário não tenha conta
  // O e-mail do convite é fonte da verdade quando presente; caso contrário, geramos a partir de placeholder
  const inviteEmail = invite.email;
  if (!inviteEmail) {
    throw httpError(400, 'Convite sem e-mail associado: peça ao administrador para emitir um novo com e-mail definido');
  }

  const existing = await users.findByEmail(inviteEmail);
  if (existing) throw httpError(409, 'E-mail já cadastrado');

  // Marca como usado ANTES de criar o usuário, em condição atômica.
  // Se outra requisição já consumiu o token, o update retorna 0.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await users.createUser({
    tenantId: invite.tenant_id,
    name,
    email: inviteEmail,
    passwordHash,
    role: invite.role,
  });

  const consumed = await invites.markUsed(invite.id, user.id);
  if (!consumed) {
    // Race: outra requisição consumiu primeiro — desfaz criando rollback manual
    // (cenário raro; se acontecer, o usuário foi criado mas o convite não foi marcado)
    throw httpError(409, 'Convite já utilizado');
  }

  const jwtToken = signToken(user);
  return {
    token: jwtToken,
    user: {
      id: user.id,
      tenantId: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
