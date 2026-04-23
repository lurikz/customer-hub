import * as repo from '../repositories/tasks.repo.js';

export const listTasks = (tenantId, filters) => repo.findAll(tenantId, filters);
export const getTask = (tenantId, id) => repo.findById(tenantId, id);
export const createTask = (tenantId, data) => repo.insert(tenantId, data);
export const updateTask = (tenantId, id, data) => repo.update(tenantId, id, data);
export const deleteTask = (tenantId, id) => repo.remove(tenantId, id);
export const listTasksByClient = (tenantId, clientId) => repo.findByClient(tenantId, clientId);