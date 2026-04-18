import { z } from 'zod';

export const roleSchema = z.enum(['user', 'admin', 'super_admin']);

export const createInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido')
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  role: roleSchema,
  expiresInHours: z.number().int().min(1).max(168).default(24), // 1h..7d
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(200),
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  password: z.string().min(8, 'Senha mínima de 8 caracteres').max(200),
});
