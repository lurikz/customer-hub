import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/admin.controller.js';
import { requireRole } from '../middleware/jwtAuth.js';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Todas as rotas exigem admin ou super_admin
router.use(requireRole('admin', 'super_admin'));

router.get('/users', ctrl.listUsers);
router.post('/users', writeLimiter, ctrl.createUser);
router.patch('/users/:id/role', writeLimiter, ctrl.updateRole);
router.delete('/users/:id', writeLimiter, ctrl.deleteUser);

export default router;
