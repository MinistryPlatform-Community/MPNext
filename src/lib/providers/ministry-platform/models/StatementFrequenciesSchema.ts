import { z } from 'zod';

export const StatementFrequenciesSchema = z.object({
  Statement_Frequency_ID: z.number().int(),
  Statement_Frequency: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type StatementFrequenciesInput = z.infer<typeof StatementFrequenciesSchema>;
