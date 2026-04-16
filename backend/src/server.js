import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { runMigrations } from './db/migrate.js';
import { apiKeyAuth } from './middleware/apiKey.js';
import { errorHandler } from './middleware/errorHandler.js';
import clientsRouter from './routes/clients.routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Segurança e parsing
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/curl/healthcheck
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: false,
  })
);

// Rate limit global (proteção contra abuso)
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 120, // 120 req/min por IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Healthcheck público (sem auth) — usado pelo EasyPanel
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Rotas protegidas por API key
app.use('/clients', apiKeyAuth, clientsRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Tratamento global de erros
app.use(errorHandler);

// Boot
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ CRM API rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar a API:', err);
    process.exit(1);
  }
}

start();
