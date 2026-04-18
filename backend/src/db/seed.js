/**
 * Seed inicial: cria um tenant e um usuário "owner" (super-admin do tenant).
 *
 * Uso:
 *   SEED_TENANT_NAME="Minha Empresa" \
 *   SEED_USER_NAME="Admin" \
 *   SEED_USER_EMAIL="admin@empresa.com" \
 *   SEED_USER_PASSWORD="senhaForte123!" \
 *   npm run seed
 *
 * Idempotente: se o e-mail já existir, apenas reporta os IDs.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from './pool.js';
import { runMigrations } from './migrate.js';

async function main() {
  const tenantName = process.env.SEED_TENANT_NAME;
  const userName = process.env.SEED_USER_NAME;
  const userEmail = process.env.SEED_USER_EMAIL;
  const userPassword = process.env.SEED_USER_PASSWORD;

  if (!tenantName || !userName || !userEmail || !userPassword) {
    console.error(
      '❌ Defina SEED_TENANT_NAME, SEED_USER_NAME, SEED_USER_EMAIL, SEED_USER_PASSWORD'
    );
    process.exit(1);
  }
  if (userPassword.length < 10) {
    console.error('❌ SEED_USER_PASSWORD deve ter ao menos 10 caracteres');
    process.exit(1);
  }

  await runMigrations();

  const existing = await query('SELECT id, tenant_id FROM users WHERE email = $1', [
    userEmail.toLowerCase(),
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
     VALUES ($1, $2, $3, $4, 'owner')
     RETURNING id, tenant_id, name, email, role`,
    [tenant.rows[0].id, userName, userEmail.toLowerCase(), hash]
  );

  console.log('✅ Tenant criado:', tenant.rows[0]);
  console.log('✅ Usuário owner criado:', user.rows[0]);
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    pool.end();
    process.exit(1);
  });
