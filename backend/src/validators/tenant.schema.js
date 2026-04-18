import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, 'Nome da empresa obrigatório').max(120),
  adminName: z.string().trim().min(1, 'Nome do admin obrigatório').max(120),
  adminEmail: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
  adminPassword: z.string().min(8, 'Senha mínima de 8 caracteres').max(200),
});
