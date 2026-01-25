import { z } from 'zod';

export const AlternateEmailTypesSchema = z.object({
  Alternate_Email_Type_ID: z.number().int(),
  Display_Name: z.string().max(100),
});

export type AlternateEmailTypesInput = z.infer<typeof AlternateEmailTypesSchema>;
