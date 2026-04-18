import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
  password: z.string().min(1, 'Senha obrigatória').max(200),
});

export const changePasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter ao menos 8 caracteres')
    .max(200, 'Nova senha muito longa'),
});
