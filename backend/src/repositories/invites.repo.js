import crypto from 'node:crypto';
import { query } from '../db/pool.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateToken() {
  // 32 bytes ≈ 256 bits, base64url — não previsível
  return crypto.randomBytes(32).toString('base64url');
}

export async function create({ tenantId, email, role, createdBy, expiresAt, tokenHash }) {
  const { rows } = await query(
    `INSERT INTO invites (tenant_id, email, role, token_hash, created_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, tenant_id, email, role, created_by, expires_at, used_at, created_at`,
    [tenantId, email || null, role, tokenHash, createdBy, expiresAt]
  );
  return rows[0];
}

export async function listByTenant(tenantId) {
  const { rows } = await query(
    `SELECT id, tenant_id, email, role, created_by, expires_at, used_at, used_by, created_at
     FROM invites WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [tenantId]
  );
  return rows;
}

export async function findByTokenHash(tokenHash) {
  const { rows } = await query(
    `SELECT id, tenant_id, email, role, expires_at, used_at
     FROM invites WHERE token_hash = $1 LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

export async function markUsed(id, usedBy) {
  // Atômico: só marca se ainda não foi usado e não expirou.
  const { rowCount } = await query(
    `UPDATE invites
     SET used_at = now(), used_by = $2
     WHERE id = $1 AND used_at IS NULL AND expires_at > now()`,
    [id, usedBy]
  );
  return rowCount === 1;
}

export async function revoke(id, tenantId) {
  const { rowCount } = await query(
    `DELETE FROM invites WHERE id = $1 AND tenant_id = $2 AND used_at IS NULL`,
    [id, tenantId]
  );
  return rowCount > 0;
}
