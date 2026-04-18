import * as service from '../services/invites.service.js';
import { createInviteSchema, acceptInviteSchema } from '../validators/invite.schema.js';
import * as audit from '../repositories/audit.repo.js';

export async function create(req, res, next) {
  try {
    const data = createInviteSchema.parse(req.body);
    const { invite, token } = await service.createInvite(req.auth, data);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'admin.invite_created',
      entity: 'invite',
      entity_id: invite.id,
      ip: req.ip,
      metadata: { role: invite.role, email: invite.email },
    });
    res.status(201).json({ invite, token });
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const list = await service.listInvites(req.auth.tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
}

export async function revoke(req, res, next) {
  try {
    await service.revokeInvite(req.auth, req.params.id);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'admin.invite_revoked',
      entity: 'invite',
      entity_id: req.params.id,
      ip: req.ip,
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function lookup(req, res, next) {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'token obrigatório' });
    const meta = await service.lookupInvite(token);
    res.json(meta);
  } catch (e) {
    next(e);
  }
}

export async function accept(req, res, next) {
  try {
    const data = acceptInviteSchema.parse(req.body);
    const result = await service.acceptInvite(data);
    await audit.log({
      tenantId: result.user.tenantId,
      userId: result.user.id,
      action: 'auth.signup_via_invite',
      ip: req.ip,
      metadata: { email: result.user.email, role: result.user.role },
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}
