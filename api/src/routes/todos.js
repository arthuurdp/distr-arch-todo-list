import { Router } from 'express';
import { HttpError } from '../errors.js';
import { findTodo, listTodos } from '../todo-queries.js';
import { createTodoSchema, parseId, updateTodoSchema, validate } from '../validation.js';

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export function todosRouter(db) {
  const router = Router();

  const findCategory = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?');
  const insert = db.prepare(
    'INSERT INTO todos (user_id, title, description, due_date, category_id) VALUES (?, ?, ?, ?, ?)',
  );
  const update = db.prepare(
    `UPDATE todos
        SET title = ?, description = ?, due_date = ?, category_id = ?, completed = ?, updated_at = ${NOW}
      WHERE id = ?`,
  );
  const remove = db.prepare('DELETE FROM todos WHERE id = ?');

  function getOrFail(req) {
    const id = parseId(req.params.id);
    const todo = id && findTodo(db, req.userId, id);
    if (!todo) throw new HttpError(404, 'Tarefa não encontrada');
    return todo;
  }

  function assertCategoryExists(userId, categoryId) {
    if (categoryId != null && !findCategory.get(categoryId, userId)) {
      throw new HttpError(400, 'Dados inválidos', { categoryId: 'Categoria não encontrada' });
    }
  }

  function parseFilters(query) {
    const filters = {};

    if (query.completed !== undefined) {
      if (!['true', 'false'].includes(query.completed)) {
        throw new HttpError(400, 'Dados inválidos', { completed: 'Use true ou false' });
      }
      filters.completed = query.completed === 'true';
    }

    if (query.categoryId !== undefined) {
      const categoryId = parseId(query.categoryId);
      if (!categoryId) {
        throw new HttpError(400, 'Dados inválidos', { categoryId: 'Categoria inválida' });
      }
      filters.categoryId = categoryId;
    }

    return filters;
  }

  router.get('/', (req, res) => {
    res.json(listTodos(db, req.userId, parseFilters(req.query)));
  });

  router.post('/', (req, res) => {
    const data = validate(createTodoSchema, req.body);
    assertCategoryExists(req.userId, data.categoryId);

    const { lastInsertRowid } = insert.run(
      req.userId,
      data.title,
      data.description || null,
      data.dueDate ?? null,
      data.categoryId ?? null,
    );
    res.status(201).json(findTodo(db, req.userId, lastInsertRowid));
  });

  router.get('/:id', (req, res) => {
    res.json(getOrFail(req));
  });

  router.put('/:id', (req, res) => {
    const todo = getOrFail(req);
    const data = validate(updateTodoSchema, req.body);
    assertCategoryExists(req.userId, data.categoryId);

    update.run(
      data.title,
      data.description || null,
      data.dueDate ?? null,
      data.categoryId ?? null,
      data.completed ? 1 : 0,
      todo.id,
    );
    res.json(findTodo(db, req.userId, todo.id));
  });

  router.delete('/:id', (req, res) => {
    const todo = getOrFail(req);
    remove.run(todo.id);
    res.status(204).end();
  });

  return router;
}
