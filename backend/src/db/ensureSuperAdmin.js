/**
 * Garante a existência de um super_admin no boot do servidor.
 * Idempotente: se o usuário já existir, não faz nada.
 *
 * Defaults (sobrescritos por env):
 *   SEED_TENANT_NAME    = "Padilha CRM"
 *   SEED_USER_NAME      = "Padilha Admin"
 *   SEED_USER_EMAIL     = "padilha@admin.com"
 *   SEED_USER_PASSWORD  = "mp469535"
 *
 * Em produção, defina SEED_USER_PASSWORD em variável de ambiente
 * e considere remover o default para forçar configuração explícita.
 */
import bcrypt from 'bcryptjs';
import { query } from './pool.js';

export async function ensureSuperAdmin() {
  const tenantName = process.env.SEED_TENANT_NAME || 'Padilha CRM';
  const userName = process.env.SEED_USER_NAME || 'Padilha Admin';
  const userEmail = (process.env.SEED_USER_EMAIL || 'padilha@admin.com').toLowerCase();
  const userPassword = process.env.SEED_USER_PASSWORD || 'mp469535';

  const existing = await query(
    'SELECT id, tenant_id, role FROM users WHERE email = $1 LIMIT 1',
    [userEmail]
  );
  if (existing.rows[0]) {
    console.log(`ℹ️  super_admin já existe (${userEmail})`);
    return;
  }

  const tenant = await query(
    'INSERT INTO tenants (name) VALUES ($1) RETURNING id, name',
    [tenantName]
  );

  const hash = await bcrypt.hash(userPassword, 12);
  await query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'super_admin')`,
    [tenant.rows[0].id, userName, userEmail, hash]
  );

  console.log(`✅ super_admin criado automaticamente: ${userEmail}`);
}
