import { Router } from 'express';

export function categoryRoutes(categoryController) {
  const router = Router();

  router.get('/', categoryController.list);
  router.post('/', categoryController.create);
  router.get('/:id', categoryController.getById);
  router.get('/:id/todos', categoryController.listTodos);
  router.put('/:id', categoryController.update);
  router.delete('/:id', categoryController.remove);

  return router;
}
