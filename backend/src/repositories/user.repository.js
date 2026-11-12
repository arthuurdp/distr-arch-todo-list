import { User } from '../models/user.model.js';

export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  findById(id) {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? User.fromRow(row) : null;
  }

  findByEmail(email) {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return row ? User.fromRow(row) : null;
  }

  create({ name, email, passwordHash }) {
    const { lastInsertRowid } = this.db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, passwordHash);
    return this.findById(lastInsertRowid);
  }
}
