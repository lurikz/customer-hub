import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as users from '../repositories/users.repo.js';
import { httpError } from '../middleware/errorHandler.js';

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw httpError(500, 'JWT_SECRET ausente ou curto');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
  return jwt.sign(
    {
      sub: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      email: user.email,
    },
    secret,
    { expiresIn, issuer: 'crm-api', audience: 'crm-app' }
  );
}

export async function login(email, password) {
  const user = await users.findByEmail(email);
  // Compara sempre (mesmo se user for nulo) para evitar timing attack básico
  const hash = user?.password_hash || '$2a$12$invalidsaltinvalidsaltinvaliuO5kQYY1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z';
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) throw httpError(401, 'Credenciais inválidas');

  const token = signToken(user);
  return {
    token,
    user: {
      id: user.id,
      tenantId: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function me(userId) {
  const u = await users.findById(userId);
  if (!u) throw httpError(404, 'Usuário não encontrado');
  return {
    id: u.id,
    tenantId: u.tenant_id,
    name: u.name,
    email: u.email,
    role: u.role,
  };
}
