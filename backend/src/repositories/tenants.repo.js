import bcrypt from 'bcryptjs';
import { pool, query } from '../db/pool.js';
import { httpError } from '../middleware/errorHandler.js';

/**
 * Lista todos os tenants com contagem de usuários e clientes.
 * Apenas super_admin (validado na rota) — vê todos os tenants do SaaS.
 */
export async function listAll() {
  const { rows } = await query(
    `SELECT
       t.id, t.name, t.created_at,
       (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.id)   AS users_count,
       (SELECT COUNT(*)::int FROM clients c WHERE c.tenant_id = t.id) AS clients_count
     FROM tenants t
     ORDER BY t.created_at DESC`
  );
  return rows;
}

/**
 * Cria um tenant + usuário admin vinculado em uma única transação.
 * Se qualquer passo falhar, nada é persistido (rollback).
 */
export async function createTenantWithAdmin({ tenantName, adminName, adminEmail, adminPassword }) {
  const email = adminEmail.toLowerCase();

  // Pré-checa duplicidade fora da transação para erro 409 limpo
  const dup = await query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
  if (dup.rowCount) throw httpError(409, 'E-mail já cadastrado');

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tenantRes = await client.query(
      `INSERT INTO tenants (name) VALUES ($1) RETURNING id, name, created_at`,
      [tenantName]
    );
    const tenant = tenantRes.rows[0];

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, tenant_id, name, email, role, created_at`,
      [tenant.id, adminName, email, passwordHash]
    );

    await client.query('COMMIT');

    return { tenant, admin: userRes.rows[0] };
  } catch (e) {
    await client.query('ROLLBACK');
    // unique_violation
    if (e.code === '23505') throw httpError(409, 'E-mail já cadastrado');
    throw e;
  } finally {
    client.release();
  }
}
