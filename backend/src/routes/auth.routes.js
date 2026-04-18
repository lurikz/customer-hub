import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/auth.controller.js';
import { jwtAuth } from '../middleware/jwtAuth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 tentativas/min/IP — protege contra brute force
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas, tente novamente em instantes' },
});

router.post('/login', loginLimiter, ctrl.login);
router.get('/me', jwtAuth, ctrl.me);

export default router;
