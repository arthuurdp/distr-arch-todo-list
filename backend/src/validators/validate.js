import { HttpError } from '../errors.js';

export function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;

  const details = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'body';
    details[field] ??= issue.message;
  }
  throw new HttpError(400, 'Dados inválidos', details);
}

export function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
