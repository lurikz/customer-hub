import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/admin.controller.js';
import * as invitesCtrl from '../controllers/invites.controller.js';
import * as tenantsCtrl from '../controllers/tenants.controller.js';
import { requireRole } from '../middleware/jwtAuth.js';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Usuários e convites: admin ou super_admin
router.get('/users', requireRole('admin', 'super_admin'), ctrl.listUsers);
router.post('/users', requireRole('admin', 'super_admin'), writeLimiter, ctrl.createUser);
router.patch('/users/:id/role', requireRole('admin', 'super_admin'), writeLimiter, ctrl.updateRole);
router.delete('/users/:id', requireRole('admin', 'super_admin'), writeLimiter, ctrl.deleteUser);

router.get('/invites', requireRole('admin', 'super_admin'), invitesCtrl.list);
router.post('/invites', requireRole('admin', 'super_admin'), writeLimiter, invitesCtrl.create);
router.delete('/invites/:id', requireRole('admin', 'super_admin'), writeLimiter, invitesCtrl.revoke);

// Tenants: APENAS super_admin (visão SaaS-wide, isolamento entre tenants)
router.get('/tenants', requireRole('super_admin'), tenantsCtrl.list);
router.post('/tenants', requireRole('super_admin'), writeLimiter, tenantsCtrl.create);

export default router;


