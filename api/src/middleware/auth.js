import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../errors.js';

export function signToken(userId) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(userId),
    expiresIn: config.jwtExpiresIn,
  });
}

export function requireAuth(db) {
  const findUser = db.prepare('SELECT id FROM users WHERE id = ?');

  return (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Token não informado');
    }

    let userId;
    try {
      userId = Number(jwt.verify(token, config.jwtSecret).sub);
    } catch {
      throw new HttpError(401, 'Token inválido ou expirado');
    }

    if (!findUser.get(userId)) {
      throw new HttpError(401, 'Token inválido ou expirado');
    }

    req.userId = userId;
    next();
  };
}
