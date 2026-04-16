import * as service from '../services/clients.service.js';
import {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
} from '../validators/client.schema.js';
import { httpError } from '../middleware/errorHandler.js';

export async function list(_req, res, next) {
  try {
    const clients = await service.listClients();
    res.json(clients);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const client = await service.getClient(id);
    if (!client) throw httpError(404, 'Cliente não encontrado');
    res.json(client);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const data = createClientSchema.parse(req.body);
    const created = await service.createClient(data);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = updateClientSchema.parse(req.body);
    const updated = await service.updateClient(id, data);
    if (!updated) throw httpError(404, 'Cliente não encontrado');
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const ok = await service.deleteClient(id);
    if (!ok) throw httpError(404, 'Cliente não encontrado');
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
