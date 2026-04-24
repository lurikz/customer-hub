import { Router } from 'express';
import { jwtAuth, requireRole } from '../middleware/jwtAuth.js';
 import * as usersRepo from '../repositories/users.repo.js';
 import bcrypt from 'bcryptjs';
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

 
 // --- USERS ---
 router.get('/users', async (_req, res, next) => {
   try {
     const { rows } = await query(
       `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.role_id, u.created_at, t.name as tenant_name, r.name as role_name
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC`
     );
     res.json(rows);
   } catch (e) { next(e); }
 });
 
 router.post('/users', async (req, res, next) => {
   try {
     const { tenant_id, name, email, password, role, role_id } = req.body;
 
     // Validação de limite de usuários pelo plano
     if (tenant_id) {
       const { rows: tenantInfo } = await query(
         `SELECT t.id, p.max_users 
          FROM tenants t 
          LEFT JOIN plans p ON t.plan_id = p.id 
          WHERE t.id = $1`, 
         [tenant_id]
       );
       
       if (tenantInfo[0]?.max_users) {
         const { rows: count } = await query('SELECT COUNT(*)::int as n FROM users WHERE tenant_id = $1', [tenant_id]);
         if (count[0].n >= tenantInfo[0].max_users) {
           return res.status(403).json({ error: 'Limite de usuários atingido para este plano.' });
         }
       }
     }
 
     const hash = await bcrypt.hash(password, 12);
     const { rows } = await query(
       `INSERT INTO users (tenant_id, name, email, password_hash, role, role_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, role, created_at`,
       [tenant_id, name, email.toLowerCase(), hash, role || 'user', role_id]
     );
     res.json(rows[0]);
   } catch (e) { next(e); }
 });
 
 // --- TENANTS (EMPRESAS) ---
 router.get('/tenants', async (_req, res, next) => {
   try {
     const { rows } = await query(
       `SELECT t.*, p.name as plan_name,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id)::int as users_count,
        p.max_users
        FROM tenants t
        LEFT JOIN plans p ON t.plan_id = p.id
        ORDER BY t.created_at DESC`
     );
     res.json(rows);
   } catch (e) { next(e); }
 });
 
 router.post('/tenants', async (req, res, next) => {
   try {
     const { name, cnpj, plan_id } = req.body;
     const { rows } = await query(
       `INSERT INTO tenants (name, cnpj, plan_id) VALUES ($1, $2, $3) RETURNING *`,
       [name, cnpj, plan_id]
     );
     res.json(rows[0]);
   } catch (e) { next(e); }
 });
 
 // --- PLANS ---
 router.get('/plans', async (_req, res, next) => {
   try {
     const { rows } = await query('SELECT * FROM plans ORDER BY created_at DESC');
     res.json(rows);
   } catch (e) { next(e); }
 });
 
 router.post('/plans', async (req, res, next) => {
   try {
     const { name, max_users, features } = req.body;
     const { rows } = await query(
       `INSERT INTO plans (name, max_users, features) VALUES ($1, $2, $3) RETURNING *`,
       [name, max_users, JSON.stringify(features)]
     );
     res.json(rows[0]);
   } catch (e) { next(e); }
 });
 
 // --- ROLES ---
 router.get('/roles', async (_req, res, next) => {
   try {
     const { rows } = await query(
       `SELECT r.*, t.name as tenant_name 
        FROM roles r 
        LEFT JOIN tenants t ON r.tenant_id = t.id 
        ORDER BY r.created_at DESC`
     );
     res.json(rows);
   } catch (e) { next(e); }
 });
 
 router.post('/roles', async (req, res, next) => {
   try {
     const { name, tenant_id, permissions } = req.body;
     const { rows } = await query(
       `INSERT INTO roles (name, tenant_id, permissions) VALUES ($1, $2, $3) RETURNING *`,
       [name, tenant_id || null, JSON.stringify(permissions)]
     );
     res.json(rows[0]);
   } catch (e) { next(e); }
 });
 

export default router;
