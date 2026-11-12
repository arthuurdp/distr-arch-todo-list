import { Todo } from '../models/todo.model.js';

const SELECT = `
  SELECT t.*, c.name AS category_name
    FROM todos t
    LEFT JOIN categories c ON c.id = t.category_id
`;

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export class TodoRepository {
  constructor(db) {
    this.db = db;
  }

  findAllByUser(userId, { completed, categoryId } = {}) {
    const where = ['t.user_id = ?'];
    const params = [userId];

    if (completed !== undefined) {
      where.push('t.completed = ?');
      params.push(completed ? 1 : 0);
    }
    if (categoryId !== undefined) {
      where.push('t.category_id = ?');
      params.push(categoryId);
    }

    return this.db
      .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY t.created_at DESC, t.id DESC`)
      .all(...params)
      .map(Todo.fromRow);
  }

  findByIdAndUser(id, userId) {
    const row = this.db.prepare(`${SELECT} WHERE t.id = ? AND t.user_id = ?`).get(id, userId);
    return row ? Todo.fromRow(row) : null;
  }

  create({ userId, title, description, dueDate, categoryId }) {
    const { lastInsertRowid } = this.db
      .prepare(
        'INSERT INTO todos (user_id, title, description, due_date, category_id) VALUES (?, ?, ?, ?, ?)',
      )
      .run(userId, title, description, dueDate, categoryId);
    return this.findByIdAndUser(lastInsertRowid, userId);
  }

  update(id, { title, description, dueDate, categoryId, completed }) {
    this.db
      .prepare(
        `UPDATE todos
            SET title = ?, description = ?, due_date = ?, category_id = ?, completed = ?, updated_at = ${NOW}
          WHERE id = ?`,
      )
      .run(title, description, dueDate, categoryId, completed ? 1 : 0, id);
  }

  delete(id) {
    this.db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  }
}
