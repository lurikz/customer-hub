import { Router } from 'express';
import { jwtAuth, requireRole } from '../middleware/jwtAuth.js';
import * as users from '../repositories/users.repo.js';
import { query } from '../db/pool.js';

const router = Router();

// Todas as rotas /admin exigem JWT + role super_admin.
router.use(jwtAuth, requireRole('super_admin'));

/**
 * GET /admin
 * Painel resumido — confirma acesso e retorna contagens globais.
 */
router.get('/', async (_req, res, next) => {
  try {
    const [{ rows: t }, { rows: u }, { rows: c }] = await Promise.all([
      query('SELECT COUNT(*)::int AS n FROM tenants'),
      query('SELECT COUNT(*)::int AS n FROM users'),
      query('SELECT COUNT(*)::int AS n FROM clients'),
    ]);
    res.json({
      ok: true,
      stats: { tenants: t[0].n, users: u[0].n, clients: c[0].n },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /admin/users
 * Lista todos os usuários do sistema (super_admin enxerga global).
 */
router.get('/users', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, tenant_id, name, email, role, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
