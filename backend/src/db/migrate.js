import { pool } from './pool.js';

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TENANTS
-- =====================================================
 CREATE TABLE IF NOT EXISTS plans (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name        TEXT NOT NULL,
   max_users   INTEGER NOT NULL DEFAULT 1,
   features    JSONB NOT NULL DEFAULT '{}'::jsonb,
   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
 CREATE TABLE IF NOT EXISTS tenants (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name        TEXT NOT NULL,
   plan_id     UUID REFERENCES plans(id) ON DELETE SET NULL,
   cnpj        TEXT,
   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
 CREATE TABLE IF NOT EXISTS roles (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name        TEXT NOT NULL,
   tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
   permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 );

-- =====================================================
-- USERS
-- role: 'user' | 'admin' | 'super_admin'
-- (legado: aceita 'owner' e 'member' temporariamente — migrados abaixo)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'user',
  role_id        UUID REFERENCES roles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

-- super_admin global pode ter tenant_id NULL
-- super_admin global pode ter tenant_id NULL
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- Colunas adicionais necessárias
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Migração de roles legadas
UPDATE users SET role = 'super_admin' WHERE role = 'owner';
UPDATE users SET role = 'user' WHERE role = 'member';

-- Garante CHECK atualizado
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user','admin','super_admin'));

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- =====================================================
-- CLIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
   name        TEXT NOT NULL,
   company     TEXT,
   birth_date  DATE,
   email       TEXT,
   phone       TEXT,
   cpf_cnpj    TEXT,
   notes       TEXT,
   source      TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
 ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
 ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
 ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
 ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
 ALTER TABLE clients ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients (tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_created ON clients (tenant_id, created_at DESC);

-- =====================================================
-- AUDIT LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT,
  entity_id   TEXT,
  ip          TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log (user_id);

-- =====================================================
-- TRIGGER updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- INVITES (cadastro por convite, token de uso único)
-- token_hash: SHA-256 do token plaintext (nunca armazenamos o token)
-- =====================================================
CREATE TABLE IF NOT EXISTS invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('user','admin','super_admin')),
  token_hash    TEXT NOT NULL UNIQUE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  used_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

 CREATE INDEX IF NOT EXISTS idx_invites_tenant_created ON invites (tenant_id, created_at DESC);
 CREATE INDEX IF NOT EXISTS idx_invites_expires ON invites (expires_at);
 
 -- =====================================================
 -- CLIENT RECORDS
 -- =====================================================
 CREATE TABLE IF NOT EXISTS client_records (
   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
   tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
   description TEXT NOT NULL,
   type        TEXT,
   created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 
  ALTER TABLE client_records ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
  ALTER TABLE client_records ADD COLUMN IF NOT EXISTS task_title TEXT;

 CREATE INDEX IF NOT EXISTS idx_records_client_created ON client_records (client_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_records_tenant ON client_records (tenant_id);

    -- =====================================================
    -- TASKS (Agenda)
    -- =====================================================
    CREATE TABLE IF NOT EXISTS tasks (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      description   TEXT,
      datetime      TIMESTAMPTZ NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pendente',
    -- Atualiza a constraint de status para as tarefas
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
      CHECK (status IN ('pendente', 'em_andamento', 'concluído', 'cancelada', 'ganho'));

      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_tenant_datetime ON tasks (tenant_id, datetime);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks (user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks (client_id);

    -- =====================================================
    -- TASK EXECUTION LOGS
    -- =====================================================
    CREATE TABLE IF NOT EXISTS task_execution_logs (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      description   TEXT NOT NULL,
      result        TEXT,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_execution_logs (task_id);
    CREATE INDEX IF NOT EXISTS idx_task_logs_tenant ON task_execution_logs (tenant_id);

    DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
    CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `;

export async function runMigrations() {
  console.log('🛠  Rodando migrations...');
  await pool.query(SQL);
  console.log('✅ Migrations aplicadas');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
