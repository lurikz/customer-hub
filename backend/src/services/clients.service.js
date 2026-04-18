import * as repo from '../repositories/clients.repo.js';

export const listClients = (tenantId) => repo.findAll(tenantId);
export const getClient = (tenantId, id) => repo.findById(tenantId, id);
export const createClient = (tenantId, userId, data) => repo.insert(tenantId, userId, data);
export const updateClient = (tenantId, id, data) => repo.update(tenantId, id, data);
export const deleteClient = (tenantId, id) => repo.remove(tenantId, id);
