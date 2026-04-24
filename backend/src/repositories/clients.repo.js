 export async function listOrigins(tenantId) {
   const { rows } = await query(
     `SELECT DISTINCT source 
      FROM clients 
      WHERE tenant_id = $1 AND source IS NOT NULL AND source <> '' 
      ORDER BY source ASC`,
     [tenantId]
   );
   const sources = rows.map(r => r.source);
   return sources.length > 0 ? sources : ['Indicação', 'Lead', 'Instagram', 'WhatsApp'];
 }
 
/**
 * Repository: acesso direto ao banco. Toda query DEVE filtrar por tenant_id.
 */
import { query } from '../db/pool.js';

 const COLUMNS = 'id, tenant_id, name, company, birth_date, email, phone, cpf_cnpj, notes, source, created_by, created_at, updated_at';

export async function findAll(tenantId) {
  const { rows } = await query(
    `SELECT c.*, u.name as created_by_name
     FROM clients c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.tenant_id = $1
     ORDER BY c.created_at DESC`,
    [tenantId]
  );
  return rows;
}

export async function findById(tenantId, id) {
  const { rows } = await query(
    `SELECT c.*, u.name as created_by_name
     FROM clients c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.tenant_id = $1 AND c.id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

export async function insert(tenantId, userId, data) {
   const { 
     name, 
     company = null, 
     birth_date = null, 
     email = null, 
     phone = null, 
     cpf_cnpj = null, 
     notes = null, 
     source = null 
   } = data;
   const { rows } = await query(
     `INSERT INTO clients (tenant_id, created_by, name, company, birth_date, email, phone, cpf_cnpj, notes, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING ${COLUMNS}`,
     [tenantId, userId, name, company, birth_date, email, phone, cpf_cnpj, notes, source]
   );
  return findById(tenantId, rows[0].id);
}

 export async function update(tenantId, id, data) {
   const allowed = ['name', 'company', 'birth_date', 'email', 'phone', 'cpf_cnpj', 'notes', 'source'];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (key in data) {
      sets.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }
  if (sets.length === 0) return findById(tenantId, id);

  values.push(tenantId, id);
  const { rows } = await query(
    `UPDATE clients SET ${sets.join(', ')}
     WHERE tenant_id = $${i++} AND id = $${i}
     RETURNING ${COLUMNS}`,
    values
  );
  return rows[0] || null;
}

export async function remove(tenantId, id) {
  const { rowCount } = await query(
    `DELETE FROM clients WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rowCount > 0;
}
