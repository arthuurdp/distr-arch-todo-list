import { Router } from 'express';
import { HttpError } from '../errors.js';
import { listTodos } from '../todo-queries.js';
import { categorySchema, parseId, validate } from '../validation.js';

const SELECT_CATEGORY = `
  SELECT c.id,
         c.name,
         c.created_at AS createdAt,
         (SELECT COUNT(*) FROM todos t WHERE t.category_id = c.id) AS todoCount
    FROM categories c
`;

export function categoriesRouter(db) {
  const router = Router();

  const list = db.prepare(`${SELECT_CATEGORY} WHERE c.user_id = ? ORDER BY c.name COLLATE NOCASE`);
  const findById = db.prepare(`${SELECT_CATEGORY} WHERE c.id = ? AND c.user_id = ?`);
  const findByName = db.prepare(
    'SELECT id FROM categories WHERE user_id = ? AND name = ? COLLATE NOCASE',
  );
  const insert = db.prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)');
  const update = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
  const remove = db.prepare('DELETE FROM categories WHERE id = ?');

  function getOrFail(req) {
    const id = parseId(req.params.id);
    const category = id && findById.get(id, req.userId);
    if (!category) throw new HttpError(404, 'Categoria não encontrada');
    return category;
  }

  function assertNameIsFree(userId, name, ignoreId) {
    const existing = findByName.get(userId, name);
    if (existing && existing.id !== ignoreId) {
      throw new HttpError(409, 'Já existe uma categoria com esse nome');
    }
  }

  router.get('/', (req, res) => {
    res.json(list.all(req.userId));
  });

  router.post('/', (req, res) => {
    const { name } = validate(categorySchema, req.body);
    assertNameIsFree(req.userId, name);

    const { lastInsertRowid } = insert.run(req.userId, name);
    res.status(201).json(findById.get(lastInsertRowid, req.userId));
  });

  router.get('/:id', (req, res) => {
    res.json(getOrFail(req));
  });

  router.get('/:id/todos', (req, res) => {
    const category = getOrFail(req);
    res.json(listTodos(db, req.userId, { categoryId: category.id }));
  });

  router.put('/:id', (req, res) => {
    const category = getOrFail(req);
    const { name } = validate(categorySchema, req.body);
    assertNameIsFree(req.userId, name, category.id);

    update.run(name, category.id);
    res.json(findById.get(category.id, req.userId));
  });

  router.delete('/:id', (req, res) => {
    const category = getOrFail(req);
    remove.run(category.id);
    res.status(204).end();
  });

  return router;
}
