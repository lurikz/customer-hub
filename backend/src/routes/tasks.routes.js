 import { Router } from 'express';
 import * as controller from '../controllers/tasks.controller.js';

 const router = Router();

 router.post('/:id/complete', controller.complete);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/client/:id', controller.listByClient);

export default router;