import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/auth.controller.js';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas, tente novamente em instantes' },
});

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de troca de senha, tente novamente em instantes' },
});

router.post('/login', loginLimiter, ctrl.login);
router.get('/me', jwtAuth, ctrl.me);
router.post('/change-password', passwordChangeLimiter, jwtAuth, ctrl.changePassword);

export default router;
