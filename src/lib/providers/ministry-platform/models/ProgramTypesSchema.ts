import { z } from 'zod';

export const ProgramTypesSchema = z.object({
  Program_Type_ID: z.number().int(),
  Program_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ProgramTypesInput = z.infer<typeof ProgramTypesSchema>;
