/**
 * Seed do usuário MASTER (super_admin global, sem tenant).
 * Idempotente:
 *   - Se não existir → cria.
 *   - Se existir com role diferente → promove para super_admin.
 *   - Se existir como super_admin → não faz nada.
 *
 * Defaults sobrescritos por env (recomendado em produção):
 *   MASTER_EMAIL    = padilha.ctt@gmail.com
 *   MASTER_PASSWORD = mp469535
 *   MASTER_NAME     = Padilha Master
 */
import bcrypt from 'bcryptjs';
import { query } from './pool.js';

export async function ensureMasterUser() {
  const email = (process.env.MASTER_EMAIL || 'padilha.ctt@gmail.com').toLowerCase();
  const password = process.env.MASTER_PASSWORD || 'mp469535';
  const name = process.env.MASTER_NAME || 'Padilha Master';

  const existing = await query(
    'SELECT id, role FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  if (existing.rows[0]) {
    if (existing.rows[0].role !== 'super_admin') {
      await query(
        `UPDATE users SET role = 'super_admin', tenant_id = NULL WHERE id = $1`,
        [existing.rows[0].id]
      );
      console.log(`⬆️  Usuário ${email} promovido para super_admin`);
    } else {
      console.log(`ℹ️  Master super_admin já existe (${email})`);
    }
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES (NULL, $1, $2, $3, 'super_admin')`,
    [name, email, hash]
  );
  console.log(`✅ Master super_admin criado: ${email}`);
}
