import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data e hora inválidas',
  }),
  status: z.enum(['pendente', 'em_andamento', 'concluído', 'cancelada']).default('pendente'),
  client_id: z.string().uuid('ID do cliente inválido').optional().nullable(),
  user_id: z.string().uuid('ID do usuário responsável inválido'),
});

export const updateTaskSchema = createTaskSchema.partial();

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
}).optional();