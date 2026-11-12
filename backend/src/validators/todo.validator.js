import { z } from 'zod';

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
  categoryId: z
    .number('Categoria inválida')
    .int('Categoria inválida')
    .positive('Categoria inválida')
    .nullish(),
};

export const createTodoSchema = z.object(todoFields);

export const updateTodoSchema = z.object({
  ...todoFields,
  completed: z.boolean('Informe se a tarefa está concluída'),
});

export const todoFiltersSchema = z.object({
  completed: z
    .enum(['true', 'false'], 'Use true ou false')
    .transform((value) => value === 'true')
    .optional(),
  categoryId: z
    .string('Categoria inválida')
    .regex(/^[1-9]\d*$/, 'Categoria inválida')
    .transform(Number)
    .optional(),
});
