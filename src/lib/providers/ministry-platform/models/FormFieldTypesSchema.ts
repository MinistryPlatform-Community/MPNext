import { z } from 'zod';

export const FormFieldTypesSchema = z.object({
  Form_Field_Type_ID: z.number().int(),
  Field_Type: z.string().max(50),
});

export type FormFieldTypesInput = z.infer<typeof FormFieldTypesSchema>;
