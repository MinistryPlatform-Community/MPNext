import { z } from 'zod';

export const BatchUsageTypesSchema = z.object({
  Batch_Usage_Type_ID: z.number().int(),
  Batch_Usage_Type: z.string().max(50),
});

export type BatchUsageTypesInput = z.infer<typeof BatchUsageTypesSchema>;
