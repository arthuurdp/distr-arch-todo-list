import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string('Nome é obrigatório')
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
});

export type CategoryInput = z.infer<typeof categorySchema>;
