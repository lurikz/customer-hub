/**
 * Middleware de "acesso livre" para modo demo.
 * Garante a existência de um tenant + usuário demo e injeta req.auth
 * com o mesmo formato que o jwtAuth produzia, para manter o restante
 * do código intacto.
 *
 * ⚠️ Use apenas em ambientes internos/demonstração. Não há autenticação real.
 */
import { query } from '../db/pool.js';

let cached = null;

async function ensureDemo() {
  if (cached) return cached;

  const tenantName = 'Demo';
  const userEmail = 'demo@demo.local';
  const userName = 'Demo User';

  let tenant = await query('SELECT id FROM tenants WHERE name = $1 LIMIT 1', [tenantName]);
  if (!tenant.rows[0]) {
    tenant = await query(
      'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
      [tenantName]
    );
  }
  const tenantId = tenant.rows[0].id;

  let user = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [userEmail]);
  if (!user.rows[0]) {
    user = await query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'super_admin') RETURNING id`,
      [tenantId, userName, userEmail, 'disabled']
    );
  }

  cached = {
    userId: user.rows[0].id,
    tenantId,
    role: 'super_admin',
    email: userEmail,
  };
  return cached;
}

export async function demoAuth(req, _res, next) {
  try {
    req.auth = await ensureDemo();
    next();
  } catch (e) {
    next(e);
  }
}
