import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { CategoryController } from './controllers/category.controller.js';
import { TodoController } from './controllers/todo.controller.js';
import { UserController } from './controllers/user.controller.js';
import { createAuthMiddleware } from './middlewares/auth.middleware.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { TodoRepository } from './repositories/todo.repository.js';
import { UserRepository } from './repositories/user.repository.js';
import { categoryRoutes } from './routes/category.routes.js';
import { todoRoutes } from './routes/todo.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { CategoryService } from './services/category.service.js';
import { TodoService } from './services/todo.service.js';
import { TokenService } from './services/token.service.js';
import { UserService } from './services/user.service.js';

export function createApp(db) {
  const userRepository = new UserRepository(db);
  const categoryRepository = new CategoryRepository(db);
  const todoRepository = new TodoRepository(db);

  const tokenService = new TokenService(config);
  const userService = new UserService(userRepository, tokenService);
  const categoryService = new CategoryService(categoryRepository, todoRepository);
  const todoService = new TodoService(todoRepository, categoryRepository);

  const userController = new UserController(userService);
  const categoryController = new CategoryController(categoryService);
  const todoController = new TodoController(todoService);

  const authenticate = createAuthMiddleware(tokenService, userRepository);

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/users', userRoutes(userController, authenticate));
  app.use('/api/categories', authenticate, categoryRoutes(categoryController));
  app.use('/api/todos', authenticate, todoRoutes(todoController));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
