import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './errors.js';
import { requireAuth } from './middleware/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { todosRouter } from './routes/todos.js';
import { usersRouter } from './routes/users.js';

export function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/users', usersRouter(db));
  app.use('/api/categories', requireAuth(db), categoriesRouter(db));
  app.use('/api/todos', requireAuth(db), todosRouter(db));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
