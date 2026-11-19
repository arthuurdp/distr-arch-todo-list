import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';

export function authRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/refresh', authController.refresh);
  router.post('/logout', authController.logout);

  return router;
}
