import type { RequestHandler } from 'express';
import { HttpError } from '../errors.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { TokenService } from '../services/token.service.js';

export function createAuthMiddleware(
  tokenService: TokenService,
  userRepository: UserRepository,
): RequestHandler {
  return async (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Token não informado');
    }

    const userId = tokenService.verifyAccessToken(token);
    if (!userId || !(await userRepository.findById(userId))) {
      throw new HttpError(401, 'Token inválido ou expirado');
    }

    req.userId = userId;
    next();
  };
}
