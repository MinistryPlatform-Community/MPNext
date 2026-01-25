import { z } from 'zod';

export const ResponseResultsSchema = z.object({
  Response_Result_ID: z.number().int(),
  Response_Result: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ResponseResultsInput = z.infer<typeof ResponseResultsSchema>;
