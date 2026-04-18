import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import * as users from '../repositories/users.repo.js';
import * as audit from '../repositories/audit.repo.js';
import { httpError } from '../middleware/errorHandler.js';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas, tente novamente em instantes' },
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
  password: z.string().min(1, 'Senha obrigatória').max(200),
});

// Hash dummy para nivelar tempo de resposta quando o usuário não existe (mitiga timing attack).
const DUMMY_HASH = '$2a$12$CjwlPa1234567890123456uQ5LJ8kFw3K7X2vQyZ1pH5oV9aB3cD5e';

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw httpError(500, 'JWT_SECRET ausente ou curto');
  }
  return jwt.sign(
    {
      sub: user.id,
      tenantId: user.tenant_id, // pode ser NULL para super_admin global
      role: user.role,
      email: user.email,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '12h',
      issuer: 'crm-api',
      audience: 'crm-app',
    }
  );
}

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    // Busca apenas pelo email (sem filtrar por tenant_id).
    let user = await users.findByEmail(email);
    const hash = user?.password_hash || DUMMY_HASH;
    const ok = await bcrypt.compare(password, hash);

    if (!user || !ok) {
      await audit.log({
        action: 'auth.login_failed',
        ip: req.ip,
        metadata: { email },
      });
      throw httpError(401, 'Credenciais inválidas');
    }

    // super_admin sem tenant → vincular a um workspace "Master" para usar o CRM.
    if (user.role === 'super_admin' && !user.tenant_id) {
      const tenantId = await users.ensureMasterWorkspace(user.id);
      user = { ...user, tenant_id: tenantId };
    }

    const token = signToken(user);
    await audit.log({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'auth.login',
      ip: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/me', jwtAuth, async (req, res, next) => {
  try {
    const u = await users.findById(req.auth.userId);
    if (!u) throw httpError(404, 'Usuário não encontrado');
    res.json({
      id: u.id,
      tenantId: u.tenant_id,
      name: u.name,
      email: u.email,
      role: u.role,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
