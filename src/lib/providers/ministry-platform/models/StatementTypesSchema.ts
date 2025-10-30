import { z } from 'zod';

export const StatementTypesSchema = z.object({
  Statement_Type_ID: z.number().int(),
  Statement_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type StatementTypesInput = z.infer<typeof StatementTypesSchema>;
