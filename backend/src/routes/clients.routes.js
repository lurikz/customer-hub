import { Router } from 'express';
import { checkPlanFeature, checkPermission } from '../middleware/jwtAuth.js';
import * as ctrl from '../controllers/clients.controller.js';

// JWT já aplicado no nível do app (server.js)
const router = Router();

router.get('/origins', (req, res, next) => {
  console.log('GET /clients/origins hit');
  next();
}, ctrl.listOrigins);

router.post('/origins', ctrl.createOrigin);

router.get('/', checkPlanFeature('clientes'), checkPermission('clientes.visualizar'), ctrl.list);

router.get('/:id', (req, res, next) => {
  // Impede que 'origins' caia aqui
  if (req.params.id === 'origins') return next('route');
  next();
}, checkPlanFeature('clientes'), checkPermission('clientes.visualizar'), ctrl.getOne);

router.post('/', checkPlanFeature('clientes'), checkPermission('clientes.editar'), ctrl.create);
router.put('/:id', checkPlanFeature('clientes'), checkPermission('clientes.editar'), ctrl.update);
router.delete('/:id', checkPlanFeature('clientes'), checkPermission('clientes.excluir'), ctrl.remove);

router.get('/:id/records', ctrl.listRecords);
router.post('/:id/records', ctrl.createRecord);

export default router;
