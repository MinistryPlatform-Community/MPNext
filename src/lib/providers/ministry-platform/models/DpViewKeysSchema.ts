import { z } from 'zod';

export const DpViewKeysSchema = z.object({
  View_Key_ID: z.number().int(),
  View_Name: z.unknown(),
  Field_Name: z.string().max(128),
  Foreign_Table_Name: z.unknown(),
  Foreign_Field_Name: z.string().max(128),
});

export type DpViewKeysInput = z.infer<typeof DpViewKeysSchema>;
