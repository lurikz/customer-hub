import { z } from 'zod';

export const roleSchema = z.enum(['user', 'admin', 'super_admin']);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
  password: z.string().min(8, 'Senha mínima de 8 caracteres').max(200),
  role: roleSchema,
});

export const updateRoleSchema = z.object({
  role: roleSchema,
});
