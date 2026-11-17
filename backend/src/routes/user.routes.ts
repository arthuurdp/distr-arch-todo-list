import { Router, type RequestHandler } from 'express';
import type { UserController } from '../controllers/user.controller.js';

export function userRoutes(userController: UserController, authenticate: RequestHandler): Router {
  const router = Router();

  router.post('/register', userController.register);
  router.post('/login', userController.login);
  router.post('/refresh', userController.refresh);
  router.post('/logout', userController.logout);
  router.get('/me', authenticate, userController.me);

  return router;
}
