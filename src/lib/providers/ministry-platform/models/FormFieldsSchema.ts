import { z } from 'zod';

export const FormFieldsSchema = z.object({
  Form_Field_ID: z.number().int(),
  Field_Order: z.number().int(),
  Field_Label: z.string().max(128),
  Field_Type_ID: z.number().int(),
  Field_Values: z.string().max(4000).nullable(),
  Required: z.boolean(),
  Form_ID: z.number().int(),
  Placement_Required: z.boolean(),
  Alternate_Label: z.string().max(2147483647).nullable(),
  Is_Hidden: z.boolean(),
  Depends_On: z.number().int().nullable(),
  Depends_On_Value: z.string().max(255).nullable(),
});

export type FormFieldsInput = z.infer<typeof FormFieldsSchema>;
