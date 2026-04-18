import * as service from '../services/auth.service.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.schema.js';
import * as audit from '../repositories/audit.repo.js';

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await service.login(email, password);
    await audit.log({
      tenantId: result.user.tenantId,
      userId: result.user.id,
      action: 'auth.login',
      ip: req.ip,
    });
    res.json(result);
  } catch (e) {
    if (e.status === 401) {
      await audit.log({
        action: 'auth.login_failed',
        ip: req.ip,
        metadata: { email: req.body?.email || null },
      });
    }
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await service.me(req.auth.userId);
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await service.changePassword(req.auth.userId, currentPassword, newPassword);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'auth.password_changed',
      ip: req.ip,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
