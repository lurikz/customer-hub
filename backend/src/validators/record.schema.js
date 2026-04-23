 import { z } from 'zod';
 
 export const createRecordSchema = z.object({
   description: z.string().trim().min(1, 'Descrição é obrigatória').max(5000),
   type: z.string().trim().max(50).optional().nullable(),
 });