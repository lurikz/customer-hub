 import { query } from '../db/pool.js';
 
 const COLUMNS = 'id, client_id, tenant_id, description, type, created_by, created_at';
 
 export async function findAllByClient(tenantId, clientId) {
   const { rows } = await query(
     `SELECT r.*, u.name as created_by_name
      FROM client_records r
      LEFT JOIN users u ON u.id = r.created_by
      WHERE r.tenant_id = $1 AND r.client_id = $2
      ORDER BY r.created_at DESC`,
     [tenantId, clientId]
   );
   return rows;
 }
 
 export async function insert(tenantId, userId, clientId, data) {
   const { description, type = null } = data;
   const { rows } = await query(
     `INSERT INTO client_records (tenant_id, created_by, client_id, description, type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${COLUMNS}`,
     [tenantId, userId, clientId, description, type]
   );
   return rows[0];
 }