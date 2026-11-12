import { HttpError } from '../errors.js';

export function notFound(req, res, next) {
  next(new HttpError(404, 'Rota não encontrada'));
}

export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
