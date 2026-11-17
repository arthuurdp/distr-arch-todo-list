import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors.js';

export const notFound: RequestHandler = (req, res, next) => {
  next(new HttpError(404, 'Rota não encontrada'));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
};
