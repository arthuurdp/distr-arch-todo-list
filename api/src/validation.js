import { z } from 'zod';
import { HttpError } from './errors.js';

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

const email = z
  .string('Email é obrigatório')
  .trim()
  .toLowerCase()
  .pipe(z.email('Email inválido'));

export const registerSchema = z.object({
  name: z
    .string('Nome é obrigatório')
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email,
  password: z
    .string('Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres'),
});

export const loginSchema = z.object({
  email,
  password: z.string('Senha é obrigatória').min(1, 'Senha é obrigatória'),
});

export const categorySchema = z.object({
  name: z
    .string('Nome é obrigatório')
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
});

const todoFields = {
  title: z
    .string('Título é obrigatório')
    .trim()
    .min(1, 'Título é obrigatório')
    .max(120, 'Título deve ter no máximo 120 caracteres'),
  description: z
    .string('Descrição inválida')
    .trim()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .nullish(),
  dueDate: z.iso.date('Prazo deve estar no formato AAAA-MM-DD').nullish(),
  categoryId: z.number('Categoria inválida').int('Categoria inválida').positive('Categoria inválida').nullish(),
};

export const createTodoSchema = z.object(todoFields);

export const updateTodoSchema = z.object({
  ...todoFields,
  completed: z.boolean('Informe se a tarefa está concluída'),
});
