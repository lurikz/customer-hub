import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { runMigrations } from './db/migrate.js';
import { apiKeyAuth } from './middleware/apiKey.js';
import { jwtAuth } from './middleware/jwtAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import clientsRouter from './routes/clients.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import invitesPublicRouter from './routes/invites.public.routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: false,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', apiKeyAuth, authRouter);
app.use('/invites', apiKeyAuth, invitesPublicRouter); // público (sem JWT) — lookup/accept
app.use('/clients', apiKeyAuth, jwtAuth, clientsRouter);
app.use('/admin', apiKeyAuth, jwtAuth, adminRouter);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use(errorHandler);

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET ausente ou < 32 chars. Defina no .env');
      process.exit(1);
    }
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
