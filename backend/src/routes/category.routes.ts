import { Router } from 'express';
import type { CategoryController } from '../controllers/category.controller.js';

export function categoryRoutes(categoryController: CategoryController): Router {
  const router = Router();

  router.get('/', categoryController.list);
  router.post('/', categoryController.create);
  router.get('/:id', categoryController.getById);
  router.get('/:id/todos', categoryController.listTodos);
  router.put('/:id', categoryController.update);
  router.delete('/:id', categoryController.remove);

  return router;
}
