import { z } from 'zod';

export const NeedTypesSchema = z.object({
  Need_Type_ID: z.number().int(),
  Need_Type: z.string().max(50),
  Need_Campaign_ID: z.number().int(),
});

export type NeedTypesInput = z.infer<typeof NeedTypesSchema>;
