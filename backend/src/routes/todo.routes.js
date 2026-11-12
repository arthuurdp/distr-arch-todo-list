import { Router } from 'express';

export function todoRoutes(todoController) {
  const router = Router();

  router.get('/', todoController.list);
  router.post('/', todoController.create);
  router.get('/:id', todoController.getById);
  router.put('/:id', todoController.update);
  router.delete('/:id', todoController.remove);

  return router;
}
