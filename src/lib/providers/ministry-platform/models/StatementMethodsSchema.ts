import { z } from 'zod';

export const StatementMethodsSchema = z.object({
  Statement_Method_ID: z.number().int(),
  Statement_Method: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type StatementMethodsInput = z.infer<typeof StatementMethodsSchema>;
