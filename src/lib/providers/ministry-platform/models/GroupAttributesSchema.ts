import { z } from 'zod';

export const GroupAttributesSchema = z.object({
  Group_Attribute_ID: z.number().int(),
  Attribute_ID: z.number().int(),
  Group_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Notes: z.string().max(255).nullable(),
});

export type GroupAttributesInput = z.infer<typeof GroupAttributesSchema>;
