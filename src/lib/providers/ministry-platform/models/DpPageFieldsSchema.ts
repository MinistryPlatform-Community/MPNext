import { z } from 'zod';

export const DpPageFieldsSchema = z.object({
  Page_Field_ID: z.number().int(),
  Page_ID: z.number().int(),
  Field_Name: z.string().max(64),
  Group_Name: z.string().max(75).nullable(),
  View_Order: z.number().int().nullable(),
  Required: z.boolean(),
  Hidden: z.boolean(),
  Default_Value: z.string().max(128).nullable(),
  Filter_Clause: z.string().max(2000).nullable(),
  Depends_On_Field: z.string().max(64).nullable(),
  Field_Label: z.string().max(64).nullable(),
  Writing_Assistant_Enabled: z.boolean(),
});

export type DpPageFieldsInput = z.infer<typeof DpPageFieldsSchema>;
