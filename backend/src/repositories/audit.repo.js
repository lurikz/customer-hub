import { query } from '../db/pool.js';

export async function log({ tenantId = null, userId = null, action, entity = null, entityId = null, ip = null, metadata = null }) {
  try {
    await query(
      `INSERT INTO audit_log (tenant_id, user_id, action, entity, entity_id, ip, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, userId, action, entity, entityId == null ? null : String(entityId), ip, metadata]
    );
  } catch (e) {
    // Não derruba a request por falha de auditoria — apenas registra
    console.error('audit_log insert failed:', e.message);
  }
}
