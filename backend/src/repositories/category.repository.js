import { Category } from '../models/category.model.js';

const SELECT = `
  SELECT c.*,
         (SELECT COUNT(*) FROM todos t WHERE t.category_id = c.id) AS todo_count
    FROM categories c
`;

export class CategoryRepository {
  constructor(db) {
    this.db = db;
  }

  findAllByUser(userId) {
    return this.db
      .prepare(`${SELECT} WHERE c.user_id = ? ORDER BY c.name COLLATE NOCASE`)
      .all(userId)
      .map(Category.fromRow);
  }

  findByIdAndUser(id, userId) {
    const row = this.db.prepare(`${SELECT} WHERE c.id = ? AND c.user_id = ?`).get(id, userId);
    return row ? Category.fromRow(row) : null;
  }

  findByNameAndUser(name, userId) {
    const row = this.db
      .prepare(`${SELECT} WHERE c.name = ? COLLATE NOCASE AND c.user_id = ?`)
      .get(name, userId);
    return row ? Category.fromRow(row) : null;
  }

  create({ userId, name }) {
    const { lastInsertRowid } = this.db
      .prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)')
      .run(userId, name);
    return this.findByIdAndUser(lastInsertRowid, userId);
  }

  updateName(id, name) {
    this.db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
  }

  delete(id) {
    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
}
