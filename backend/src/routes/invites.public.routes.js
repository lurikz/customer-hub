import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/invites.controller.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas, tente novamente em instantes' },
});

// Rotas públicas (sem JWT) — protegidas por x-api-key no nível do app
router.get('/lookup', limiter, ctrl.lookup);
router.post('/accept', limiter, ctrl.accept);

export default router;
