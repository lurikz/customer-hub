import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não definida — defina no EasyPanel.');
}

// SSL apenas se a connection string indicar (ex.: provedores gerenciados).
// No EasyPanel, a comunicação interna entre serviços não usa SSL.
const useSsl = /sslmode=require/i.test(process.env.DATABASE_URL || '');

// Em produção, exige certificado válido (previne MITM). Para desenvolvimento
// com certificados self-signed, defina PG_SSL_INSECURE=true explicitamente.
const allowInsecureSsl =
  process.env.PG_SSL_INSECURE === 'true' && process.env.NODE_ENV !== 'production';

const sslConfig = useSsl
  ? {
      rejectUnauthorized: !allowInsecureSsl,
      ...(process.env.PG_SSL_CA ? { ca: process.env.PG_SSL_CA } : {}),
    }
  : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export const query = (text, params) => pool.query(text, params);
