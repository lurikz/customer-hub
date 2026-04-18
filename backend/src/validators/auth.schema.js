import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
  password: z.string().min(1, 'Senha obrigatória').max(200),
});
