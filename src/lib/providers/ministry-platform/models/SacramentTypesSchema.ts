import { z } from 'zod';

export const SacramentTypesSchema = z.object({
  Sacrament_Type_ID: z.number().int(),
  Sacrament_Type: z.string().max(50),
  Active: z.boolean(),
});

export type SacramentTypesInput = z.infer<typeof SacramentTypesSchema>;
