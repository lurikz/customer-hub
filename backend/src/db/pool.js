import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não definida — defina no EasyPanel.');
}

// SSL apenas se a connection string indicar (ex.: provedores gerenciados).
// No EasyPanel, a comunicação interna entre serviços não usa SSL.
const useSsl = /sslmode=require/i.test(process.env.DATABASE_URL || '');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export const query = (text, params) => pool.query(text, params);
