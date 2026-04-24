import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

 import * as usersRepo from '../repositories/users.repo.js';
 import { query } from '../db/pool.js';
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
     let user = await usersRepo.findByEmail(email);
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

     if (user.role === 'super_admin' && !user.tenant_id) {
       const tenantId = await usersRepo.ensureMasterWorkspace(user.id);
       user = { ...user, tenant_id: tenantId };
     }
 
     const { rows: userRoles } = await query(
       `SELECT r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
       [user.id]
     );
     const { rows: planFeatures } = await query(
       `SELECT p.features FROM tenants t JOIN plans p ON t.plan_id = p.id WHERE t.id = $1`,
       [user.tenant_id]
     );

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
         permissions: userRoles[0]?.permissions || {},
         features: planFeatures[0]?.features || {}
       },
     });
  } catch (e) {
    next(e);
  }
});

 router.get('/me', jwtAuth, async (req, res, next) => {
   try {
     const u = await usersRepo.findById(req.auth.userId);
     if (!u) throw httpError(404, 'Usuário não encontrado');
     
     const { rows: userRoles } = await query(
       `SELECT r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
       [u.id]
     );
     const { rows: planFeatures } = await query(
       `SELECT p.features FROM tenants t JOIN plans p ON t.plan_id = p.id WHERE t.id = $1`,
       [u.tenant_id]
     );
 
     res.json({
       id: u.id,
       tenantId: u.tenant_id,
       name: u.name,
       email: u.email,
       role: u.role,
       permissions: userRoles[0]?.permissions || {},
       features: planFeatures[0]?.features || {}
     });
   } catch (e) { next(e); }
 });

router.get('/team', jwtAuth, async (req, res, next) => {
  try {
     const team = await usersRepo.listByTenant(req.auth.tenantId);
    res.json(team);
  } catch (e) {
    next(e);
  }
});

export default router;
