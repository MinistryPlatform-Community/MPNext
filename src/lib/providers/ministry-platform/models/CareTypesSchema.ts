import { z } from 'zod';

export const CareTypesSchema = z.object({
  Care_Type_ID: z.number().int(),
  Care_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  User_ID: z.number().int().nullable(),
});

export type CareTypesInput = z.infer<typeof CareTypesSchema>;
