import { z } from 'zod';

export const AttributeTypesSchema = z.object({
  Attribute_Type_ID: z.number().int(),
  Attribute_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Available_Online: z.boolean(),
  Online_Sort_Order: z.number().int().nullable(),
});

export type AttributeTypesInput = z.infer<typeof AttributeTypesSchema>;
