import { z } from 'zod';

export const OrdinationTypesSchema = z.object({
  Ordination_Type_ID: z.number().int(),
  Ordination_Type: z.string().max(50),
});

export type OrdinationTypesInput = z.infer<typeof OrdinationTypesSchema>;
