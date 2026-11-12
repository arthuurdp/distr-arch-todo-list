import { Router } from 'express';

export function userRoutes(userController, authenticate) {
  const router = Router();

  router.post('/register', userController.register);
  router.post('/login', userController.login);
  router.get('/me', authenticate, userController.me);

  return router;
}
