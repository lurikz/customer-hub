import { query } from '../db/pool.js';

const COLUMNS = 'id, tenant_id, client_id, user_id, title, description, datetime, status, created_at, updated_at';

export async function findAll(tenantId, filters = {}) {
  const values = [tenantId];
  let sql = `
    SELECT t.*, c.name as client_name, u.name as user_name
    FROM tasks t
    LEFT JOIN clients c ON c.id = t.client_id
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.tenant_id = $1
  `;

  if (filters.userId) {
    values.push(filters.userId);
    sql += ` AND t.user_id = $${values.length}`;
  }

  if (filters.clientId) {
    values.push(filters.clientId);
    sql += ` AND t.client_id = $${values.length}`;
  }

  sql += ` ORDER BY t.datetime ASC`;

  const { rows } = await query(sql, values);
  return rows;
}

export async function findById(tenantId, id) {
  const { rows } = await query(
    `SELECT t.*, c.name as client_name, u.name as user_name
     FROM tasks t
     LEFT JOIN clients c ON c.id = t.client_id
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.tenant_id = $1 AND t.id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

export async function insert(tenantId, data) {
  const {
    client_id = null,
    user_id,
    title,
    description = null,
    datetime,
    status = 'pendente'
  } = data;

  const { rows } = await query(
    `INSERT INTO tasks (tenant_id, client_id, user_id, title, description, datetime, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUMNS}`,
    [tenantId, client_id, user_id, title, description, datetime, status]
  );
  return findById(tenantId, rows[0].id);
}

export async function update(tenantId, id, data) {
  const allowed = ['client_id', 'user_id', 'title', 'description', 'datetime', 'status'];
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
    `UPDATE tasks SET ${sets.join(', ')}
     WHERE tenant_id = $${i++} AND id = $${i}
     RETURNING ${COLUMNS}`,
    values
  );
  return rows[0] || null;
}

export async function remove(tenantId, id) {
  const { rowCount } = await query(
    `DELETE FROM tasks WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rowCount > 0;
}

export async function findByClient(tenantId, clientId) {
  const { rows } = await query(
    `SELECT t.*, u.name as user_name
     FROM tasks t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.tenant_id = $1 AND t.client_id = $2
     ORDER BY t.datetime DESC`,
    [tenantId, clientId]
  );
  return rows;
}