import jwt from 'jsonwebtoken';
import { httpError } from './errorHandler.js';

/**
 * Valida JWT em Authorization: Bearer <token>.
 * Anexa req.auth = { userId, tenantId, role, email }.
 */
export function jwtAuth(req, _res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw httpError(500, 'Servidor mal configurado: JWT_SECRET ausente ou curto');
    }

    const header = req.header('authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw httpError(401, 'Token ausente');
    }

    const payload = jwt.verify(token, secret, {
      issuer: 'crm-api',
      audience: 'crm-app',
    });

    if (!payload.sub) {
      throw httpError(401, 'Token inválido');
    }

    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId ?? null,
      role: payload.role || 'user',
      email: payload.email,
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return next(httpError(401, 'Token expirado'));
    if (e.name === 'JsonWebTokenError') return next(httpError(401, 'Token inválido'));
    next(e);
  }
}

/**
 * Exige uma das roles informadas. Use após jwtAuth.
 *   router.get('/admin', jwtAuth, requireRole('super_admin'), handler)
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(httpError(401, 'Não autenticado'));
    if (!roles.includes(req.auth.role)) {
      return next(httpError(403, 'Permissão insuficiente'));
    }
    next();
  };
}
