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

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

const positiveInteger = (message: string) =>
  z.string(message).regex(/^[1-9]\d*$/, message).transform(Number);

export const todoFiltersSchema = z.object({
  page: positiveInteger('Página inválida').optional(),
  size: positiveInteger('Tamanho de página inválido')
    .refine((size) => size <= MAX_PAGE_SIZE, `Tamanho de página deve ser no máximo ${MAX_PAGE_SIZE}`)
    .optional(),
  completed: z
    .enum(['true', 'false'], 'Use true ou false')
    .transform((value) => value === 'true')
    .optional(),
  categoryId: z
    .string('Categoria inválida')
    .regex(/^(none|[1-9]\d*)$/, 'Categoria inválida')
    .transform((value) => (value === 'none' ? null : Number(value)))
    .optional(),
  dueBefore: z.iso
    .date('Data deve estar no formato AAAA-MM-DD')
    .transform((value) => new Date(value))
    .optional(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoFilters = z.infer<typeof todoFiltersSchema>;
