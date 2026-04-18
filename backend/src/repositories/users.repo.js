import { query } from '../db/pool.js';

export async function findByEmail(email) {
  const { rows } = await query(
    `SELECT id, tenant_id, name, email, password_hash, role
     FROM users WHERE email = $1 LIMIT 1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT id, tenant_id, name, email, role, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findByIdWithHash(id) {
  const { rows } = await query(
    `SELECT id, tenant_id, name, email, password_hash, role
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function updatePasswordHash(userId, passwordHash) {
  const { rowCount } = await query(
    `UPDATE users SET password_hash = $1 WHERE id = $2`,
    [passwordHash, userId]
  );
  return rowCount > 0;
}

export async function listByTenant(tenantId) {
  const { rows } = await query(
    `SELECT id, tenant_id, name, email, role, created_at
     FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

export async function createUser({ tenantId, name, email, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, tenant_id, name, email, role, created_at`,
    [tenantId, name, email.toLowerCase(), passwordHash, role]
  );
  return rows[0];
}

export async function updateRole(userId, tenantId, role) {
  const { rows } = await query(
    `UPDATE users SET role = $1
     WHERE id = $2 AND tenant_id = $3
     RETURNING id, tenant_id, name, email, role, created_at`,
    [role, userId, tenantId]
  );
  return rows[0] || null;
}

export async function deleteById(userId, tenantId) {
  const { rowCount } = await query(
    `DELETE FROM users WHERE id = $1 AND tenant_id = $2`,
    [userId, tenantId]
  );
  return rowCount > 0;
}
