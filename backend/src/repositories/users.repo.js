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
