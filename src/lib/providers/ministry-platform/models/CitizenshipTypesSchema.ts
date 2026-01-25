import { z } from 'zod';

export const CitizenshipTypesSchema = z.object({
  Citizenship_Type_ID: z.number().int(),
  Citizenship_Type: z.string().max(50),
});

export type CitizenshipTypesInput = z.infer<typeof CitizenshipTypesSchema>;
