import jwt from 'jsonwebtoken';
import { httpError } from './errorHandler.js';

/**
 * Valida um JWT no header Authorization: Bearer <token>.
 * Anexa req.auth = { userId, tenantId, role, email }.
 *
 * MODO ABERTO (temporário): se DEFAULT_TENANT_ID estiver definido no env e
 * não houver token, usa esse tenant como fallback. Útil enquanto a tela
 * de login estiver desativada. NÃO usar em produção real sem auth.
 */
export function jwtAuth(req, _res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw httpError(500, 'Servidor mal configurado: JWT_SECRET ausente ou curto');
    }

    const header = req.header('authorization') || '';
    const [scheme, token] = header.split(' ');

    // Fallback aberto: sem token mas com tenant default configurado
    if ((!scheme || scheme !== 'Bearer' || !token) && process.env.DEFAULT_TENANT_ID) {
      req.auth = {
        userId: process.env.DEFAULT_USER_ID || null,
        tenantId: process.env.DEFAULT_TENANT_ID,
        role: 'owner',
        email: process.env.DEFAULT_USER_EMAIL || 'anon@local',
      };
      return next();
    }

    if (scheme !== 'Bearer' || !token) {
      throw httpError(401, 'Token ausente');
    }

    const payload = jwt.verify(token, secret, {
      issuer: 'crm-api',
      audience: 'crm-app',
    });

    if (!payload.sub || !payload.tenantId) {
      throw httpError(401, 'Token inválido');
    }

    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role || 'member',
      email: payload.email,
    };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return next(httpError(401, 'Token expirado'));
    if (e.name === 'JsonWebTokenError') return next(httpError(401, 'Token inválido'));
    next(e);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(httpError(401, 'Não autenticado'));
    if (!roles.includes(req.auth.role)) {
      return next(httpError(403, 'Permissão insuficiente'));
    }
    next();
  };
}
