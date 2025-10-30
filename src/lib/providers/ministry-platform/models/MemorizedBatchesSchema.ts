import { z } from 'zod';

export const MemorizedBatchesSchema = z.object({
  Memorized_Batch_ID: z.number().int(),
  Memorized_Batch_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Congregation_ID: z.number().int().nullable(),
  Currency: z.string().max(25).nullable(),
});

export type MemorizedBatchesInput = z.infer<typeof MemorizedBatchesSchema>;
