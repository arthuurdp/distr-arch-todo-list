import { HttpError } from '../errors.js';

export function createAuthMiddleware(tokenService, userRepository) {
  return (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Token não informado');
    }

    const userId = tokenService.verify(token);
    if (!userId || !userRepository.findById(userId)) {
      throw new HttpError(401, 'Token inválido ou expirado');
    }

    req.userId = userId;
    next();
  };
}
