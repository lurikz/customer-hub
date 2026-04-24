 import jwt from 'jsonwebtoken';
 import { httpError } from './errorHandler.js';
 import { query } from '../db/pool.js';

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
 
 export function checkPlanFeature(feature) {
   return async (req, _res, next) => {
     if (!req.auth || !req.auth.tenantId) return next();
     if (req.auth.role === 'super_admin') return next();
     
     try {
       const { rows } = await query(
         `SELECT p.features FROM tenants t JOIN plans p ON t.plan_id = p.id WHERE t.id = $1`,
         [req.auth.tenantId]
       );
       const features = rows[0]?.features || {};
       if (!features[feature]) {
         return next(httpError(403, 'Funcionalidade não disponível no plano atual'));
       }
       next();
     } catch (e) { next(e); }
   };
 }
 
 export function checkPermission(permissionPath) {
   return async (req, _res, next) => {
     if (!req.auth) return next(httpError(401, 'Não autenticado'));
     if (req.auth.role === 'super_admin') return next();
 
     try {
       const { rows } = await query(
         `SELECT r.permissions FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
         [req.auth.userId]
       );
       
       const permissions = rows[0]?.permissions || {};
       const parts = permissionPath.split('.');
       let allowed = permissions;
       for (const p of parts) {
         allowed = allowed?.[p];
       }
 
       if (allowed !== true) {
         return next(httpError(403, 'Permissão insuficiente'));
       }
       next();
     } catch (e) { next(e); }
   };
 }
