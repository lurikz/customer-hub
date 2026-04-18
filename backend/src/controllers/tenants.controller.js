import * as repo from '../repositories/tenants.repo.js';
import { createTenantSchema } from '../validators/tenant.schema.js';
import * as audit from '../repositories/audit.repo.js';

export async function list(_req, res, next) {
  try {
    const tenants = await repo.listAll();
    res.json(tenants);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const data = createTenantSchema.parse(req.body);
    const result = await repo.createTenantWithAdmin({
      tenantName: data.name,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      adminPassword: data.adminPassword,
    });
    await audit.log({
      tenantId: result.tenant.id,
      userId: req.auth.userId,
      action: 'admin.tenant_created',
      entity: 'tenant',
      entity_id: result.tenant.id,
      ip: req.ip,
      metadata: { adminEmail: result.admin.email },
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}
