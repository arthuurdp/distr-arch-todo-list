import { DatabaseSync } from 'node:sqlite';

const NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))";

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW},
    UNIQUE (user_id, name)
  );

  CREATE TABLE IF NOT EXISTS todos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT,
    completed   INTEGER NOT NULL DEFAULT 0,
    due_date    TEXT,
    created_at  TEXT NOT NULL DEFAULT ${NOW},
    updated_at  TEXT NOT NULL DEFAULT ${NOW}
  );
`;

export function createDb(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schema);
  return db;
}
