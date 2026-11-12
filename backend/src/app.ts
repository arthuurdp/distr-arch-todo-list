import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { config, type AuthConfig } from './config.js';
import { CategoryController } from './controllers/category.controller.js';
import { TodoController } from './controllers/todo.controller.js';
import { UserController } from './controllers/user.controller.js';
import type { PrismaClient } from './database.js';
import { createAuthMiddleware } from './middlewares/auth.middleware.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { RefreshTokenRepository } from './repositories/refresh-token.repository.js';
import { TodoRepository } from './repositories/todo.repository.js';
import { UserRepository } from './repositories/user.repository.js';
import { categoryRoutes } from './routes/category.routes.js';
import { todoRoutes } from './routes/todo.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { CategoryService } from './services/category.service.js';
import { TodoService } from './services/todo.service.js';
import { TokenService } from './services/token.service.js';
import { UserService } from './services/user.service.js';

export function createApp(prisma: PrismaClient, authConfig: AuthConfig = config): Express {
  const userRepository = new UserRepository(prisma);
  const categoryRepository = new CategoryRepository(prisma);
  const todoRepository = new TodoRepository(prisma);
  const refreshTokenRepository = new RefreshTokenRepository(prisma);

  const tokenService = new TokenService(refreshTokenRepository, authConfig);
  const userService = new UserService(userRepository, tokenService);
  const categoryService = new CategoryService(categoryRepository, todoRepository);
  const todoService = new TodoService(todoRepository, categoryRepository);

  const userController = new UserController(userService, authConfig.cookieSecure);
  const categoryController = new CategoryController(categoryService);
  const todoController = new TodoController(todoService);

  const authenticate = createAuthMiddleware(tokenService, userRepository);

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/users', userRoutes(userController, authenticate));
  app.use('/api/categories', authenticate, categoryRoutes(categoryController));
  app.use('/api/todos', authenticate, todoRoutes(todoController));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
