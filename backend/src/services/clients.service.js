import { query } from '../db/pool.js';

const COLUMNS = 'id, name, company, birth_date, notes, created_at, updated_at';

export async function listClients() {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM clients ORDER BY created_at DESC`
  );
  return rows;
}

export async function getClient(id) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM clients WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createClient(data) {
  const { name, company = null, birth_date = null, notes = null } = data;
  const { rows } = await query(
    `INSERT INTO clients (name, company, birth_date, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [name, company, birth_date, notes]
  );
  return rows[0];
}

export async function updateClient(id, data) {
  // Atualiza dinamicamente apenas os campos enviados (parametrizado, sem SQL injection).
  const allowed = ['name', 'company', 'birth_date', 'notes'];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (key in data) {
      sets.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }

  if (sets.length === 0) return getClient(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE clients SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${COLUMNS}`,
    values
  );
  return rows[0] || null;
}

export async function deleteClient(id) {
  const { rowCount } = await query(`DELETE FROM clients WHERE id = $1`, [id]);
  return rowCount > 0;
}
