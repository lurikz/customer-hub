import { query } from '../db/pool.js';

export async function insert(tenantId, data) {
  const {
    task_id,
    user_id,
    description,
    result = null,
    notes = null
  } = data;

  const { rows } = await query(
    `INSERT INTO task_execution_logs (tenant_id, task_id, user_id, description, result, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, task_id, user_id, description, result, notes]
  );
  return rows[0];
}

export async function update(tenantId, taskId, description) {
  const { rows } = await query(
    `UPDATE task_execution_logs 
     SET description = $3
     WHERE tenant_id = $1 AND task_id = $2
     RETURNING *`,
    [tenantId, taskId, description]
  );
  return rows[0] || null;
}