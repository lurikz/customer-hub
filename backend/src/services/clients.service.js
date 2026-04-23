import * as repo from '../repositories/clients.repo.js';

 import * as recordsRepo from '../repositories/records.repo.js';
 
export const listClients = (tenantId) => repo.findAll(tenantId);
export const getClient = (tenantId, id) => repo.findById(tenantId, id);
export const createClient = (tenantId, userId, data) => repo.insert(tenantId, userId, data);
export const updateClient = (tenantId, id, data) => repo.update(tenantId, id, data);
export const deleteClient = (tenantId, id) => repo.remove(tenantId, id);
 
 export const listRecords = (tenantId, clientId) => recordsRepo.findAllByClient(tenantId, clientId);
 export const createRecord = (tenantId, userId, clientId, data) => recordsRepo.insert(tenantId, userId, clientId, data);
