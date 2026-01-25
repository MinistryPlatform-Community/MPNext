import { z } from 'zod';

export const BatchEntryTypesSchema = z.object({
  Batch_Entry_Type_ID: z.number().int(),
  Batch_Entry_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type BatchEntryTypesInput = z.infer<typeof BatchEntryTypesSchema>;
