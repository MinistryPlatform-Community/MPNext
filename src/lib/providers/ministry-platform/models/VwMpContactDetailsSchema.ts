import { z } from 'zod';

export const VwMpContactDetailsSchema = z.object({
  ID: z.number().int().nullable(),
  Contact_ID: z.number().int(),
  Household_ID: z.number().int().nullable(),
  Print_Name: z.string().max(101).nullable(),
  Nickname: z.string().max(50).nullable(),
  Last_Name: z.string().max(50).nullable(),
  "Allergies/Special_Needs": z.string().max(2147483647).nullable(),
});

export type VwMpContactDetailsInput = z.infer<typeof VwMpContactDetailsSchema>;
