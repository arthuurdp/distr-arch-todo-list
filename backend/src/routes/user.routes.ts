import { Router } from 'express';
import type { UserController } from '../controllers/user.controller.js';

export function userRoutes(userController: UserController): Router {
  const router = Router();

  router.get('/me', userController.me);

  return router;
}
