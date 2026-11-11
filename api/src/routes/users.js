import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../errors.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { loginSchema, registerSchema, validate } from '../validation.js';

export function usersRouter(db) {
  const router = Router();

  const findById = db.prepare(
    'SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?',
  );
  const findByEmail = db.prepare('SELECT id, password_hash AS passwordHash FROM users WHERE email = ?');
  const insert = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');

  router.post('/register', async (req, res) => {
    const { name, email, password } = validate(registerSchema, req.body);

    if (findByEmail.get(email)) {
      throw new HttpError(409, 'Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { lastInsertRowid } = insert.run(name, email, passwordHash);
    const user = findById.get(lastInsertRowid);

    res.status(201).json({ token: signToken(user.id), user });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = validate(loginSchema, req.body);

    const found = findByEmail.get(email);
    if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
      throw new HttpError(401, 'Email ou senha incorretos');
    }

    res.json({ token: signToken(found.id), user: findById.get(found.id) });
  });

  router.get('/me', requireAuth(db), (req, res) => {
    res.json(findById.get(req.userId));
  });

  return router;
}
