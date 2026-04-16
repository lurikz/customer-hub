import { z } from 'zod';

// Aceita "YYYY-MM-DD" ou string vazia/null
const birthDateSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD'),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v));

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120),
  company: z.string().trim().max(120).optional().nullable(),
  birth_date: birthDateSchema,
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial().refine(
  (obj) => Object.keys(obj).length > 0,
  { message: 'Envie pelo menos um campo para atualizar' }
);

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});
