import { z } from 'zod';

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
