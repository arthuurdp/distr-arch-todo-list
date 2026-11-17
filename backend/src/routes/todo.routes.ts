import { Router } from 'express';
import type { TodoController } from '../controllers/todo.controller.js';

export function todoRoutes(todoController: TodoController): Router {
  const router = Router();

  router.get('/', todoController.list);
  router.get('/summary', todoController.summary);
  router.post('/', todoController.create);
  router.get('/:id', todoController.getById);
  router.put('/:id', todoController.update);
  router.delete('/:id', todoController.remove);

  return router;
}
