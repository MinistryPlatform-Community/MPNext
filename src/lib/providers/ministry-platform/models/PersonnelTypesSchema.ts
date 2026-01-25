import { z } from 'zod';

export const PersonnelTypesSchema = z.object({
  Personnel_Type_ID: z.number().int(),
  Personnel_Type: z.string().max(50),
});

export type PersonnelTypesInput = z.infer<typeof PersonnelTypesSchema>;
