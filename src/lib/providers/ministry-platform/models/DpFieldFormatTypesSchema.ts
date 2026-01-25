import { z } from 'zod';

export const DpFieldFormatTypesSchema = z.object({
  Field_Format_Type_ID: z.number().int(),
  Name: z.string().max(100),
});

export type DpFieldFormatTypesInput = z.infer<typeof DpFieldFormatTypesSchema>;
