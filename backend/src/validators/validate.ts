import type { z } from 'zod';
import { HttpError, type ErrorDetails } from '../errors.js';

export function validate<Schema extends z.ZodType>(schema: Schema, data: unknown): z.infer<Schema> {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;

  const details: ErrorDetails = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'body';
    details[field] ??= issue.message;
  }
  throw new HttpError(400, 'Dados inválidos', details);
}

export function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
