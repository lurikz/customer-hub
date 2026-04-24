 export async function createOrigin(req, res, next) {
   try {
     const { name } = req.body;
     if (!name) throw httpError(400, 'Nome da origem é obrigatório');
     res.status(201).json(name);
   } catch (e) {
     next(e);
   }
 }
 
 export async function listOrigins(req, res, next) {
   try {
     const sources = await service.listOrigins(req.auth.tenantId);
     res.json(sources);
   } catch (e) {
     next(e);
   }
 }
 
import * as service from '../services/clients.service.js';
import * as audit from '../repositories/audit.repo.js';
import {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
} from '../validators/client.schema.js';
 import { createRecordSchema } from '../validators/record.schema.js';
import { httpError } from '../middleware/errorHandler.js';

export async function list(req, res, next) {
  try {
    const clients = await service.listClients(req.auth.tenantId);
    res.json(clients);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const client = await service.getClient(req.auth.tenantId, id);
    if (!client) throw httpError(404, 'Cliente não encontrado');
    res.json(client);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const data = createClientSchema.parse(req.body);
    const created = await service.createClient(req.auth.tenantId, req.auth.userId, data);
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'client.create',
      entity: 'client',
      entityId: created.id,
      ip: req.ip,
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = updateClientSchema.parse(req.body);
    const updated = await service.updateClient(req.auth.tenantId, id, data);
    if (!updated) throw httpError(404, 'Cliente não encontrado');
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'client.update',
      entity: 'client',
      entityId: id,
      ip: req.ip,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const ok = await service.deleteClient(req.auth.tenantId, id);
    if (!ok) throw httpError(404, 'Cliente não encontrado');
    await audit.log({
      tenantId: req.auth.tenantId,
      userId: req.auth.userId,
      action: 'client.delete',
      entity: 'client',
      entityId: id,
      ip: req.ip,
    });
     res.status(204).send();
   } catch (e) {
     next(e);
   }
 }
 
 export async function listRecords(req, res, next) {
   try {
     const { id } = idParamSchema.parse(req.params);
     const records = await service.listRecords(req.auth.tenantId, id);
     res.json(records);
   } catch (e) {
     next(e);
   }
 }
 
 export async function createRecord(req, res, next) {
   try {
     const { id } = idParamSchema.parse(req.params);
     const data = createRecordSchema.parse(req.body);
     const created = await service.createRecord(req.auth.tenantId, req.auth.userId, id, data);
     await audit.log({
       tenantId: req.auth.tenantId,
       userId: req.auth.userId,
       action: 'client.record.create',
       entity: 'client_record',
       entityId: created.id,
       ip: req.ip,
     });
     res.status(201).json(created);
   } catch (e) {
     next(e);
   }
 }
