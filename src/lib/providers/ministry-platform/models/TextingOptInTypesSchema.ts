import { z } from 'zod';

export const TextingOptInTypesSchema = z.object({
  Texting_Opt_In_Type_ID: z.number().int(),
  Texting_Opt_In_Type: z.string().max(100),
  Texting_Opt_In_Label: z.string().max(100).nullable(),
});

export type TextingOptInTypesInput = z.infer<typeof TextingOptInTypesSchema>;
