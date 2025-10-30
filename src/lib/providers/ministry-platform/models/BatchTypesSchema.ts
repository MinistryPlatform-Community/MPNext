import { z } from 'zod';

export const BatchTypesSchema = z.object({
  Batch_Type_ID: z.number().int(),
  Batch_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type BatchTypesInput = z.infer<typeof BatchTypesSchema>;
