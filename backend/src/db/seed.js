/**
 * Seed inicial: cria tenant + super_admin.
 *
 * Defaults (sobrescritos por env):
 *   SEED_TENANT_NAME = "Padilha CRM"
 *   SEED_USER_NAME   = "Padilha Admin"
 *   SEED_USER_EMAIL  = "padilha@admin.com"
 *   SEED_USER_PASSWORD = "mp469535"
 *
 * Idempotente: se o e-mail já existir, apenas reporta.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from './pool.js';
import { runMigrations } from './migrate.js';

async function main() {
  const tenantName = process.env.SEED_TENANT_NAME || 'Padilha CRM';
  const userName = process.env.SEED_USER_NAME || 'Padilha Admin';
  const userEmail = (process.env.SEED_USER_EMAIL || 'padilha@admin.com').toLowerCase();
  const userPassword = process.env.SEED_USER_PASSWORD || 'mp469535';

  if (userPassword.length < 6) {
    console.error('❌ SEED_USER_PASSWORD muito curta');
    process.exit(1);
  }

  await runMigrations();

  const existing = await query('SELECT id, tenant_id, role FROM users WHERE email = $1', [
    userEmail,
  ]);
  if (existing.rows[0]) {
    console.log('ℹ️  Usuário já existe:', existing.rows[0]);
    return;
  }

  const tenant = await query(
    'INSERT INTO tenants (name) VALUES ($1) RETURNING id, name',
    [tenantName]
  );

  const hash = await bcrypt.hash(userPassword, 12);
  const user = await query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'super_admin')
     RETURNING id, tenant_id, name, email, role`,
    [tenant.rows[0].id, userName, userEmail, hash]
  );

  console.log('✅ Tenant criado:', tenant.rows[0]);
  console.log('✅ super_admin criado:', user.rows[0]);
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    pool.end();
    process.exit(1);
  });
