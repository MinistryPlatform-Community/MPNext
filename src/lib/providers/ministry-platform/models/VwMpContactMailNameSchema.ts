import { z } from 'zod';

export const VwMpContactMailNameSchema = z.object({
  Contact_ID: z.number().int(),
  Nickname: z.string().max(50).nullable(),
  First_Name: z.string().max(50).nullable(),
  Last_Name: z.string().max(50).nullable(),
  Display_Name: z.string().max(125),
  Household_ID: z.number().int().nullable(),
  Household_Position_ID: z.number().int().nullable(),
  Prefix: z.string().max(50).nullable(),
  Suffix: z.string().max(50).nullable(),
  Gender_ID: z.number().int().nullable(),
  Position: z.number().int().nullable(),
  Company: z.boolean(),
  Spouse_Contact_ID: z.number().int().nullable(),
  Spouse_First_Name: z.string().max(50).nullable(),
  Spouse_Last_Name: z.string().max(50).nullable(),
  Spouse_Nickname: z.string().max(50).nullable(),
  Spouse_Prefix: z.string().max(50).nullable(),
  Spouse_Suffix: z.string().max(50).nullable(),
  Spouse_Display_Name: z.string().max(125).nullable(),
  Spouse_Gender_ID: z.number().int().nullable(),
  Joint_Mail_Name_Formal: z.string().max(409),
  Salutation_First_Names: z.string().max(103).nullable(),
  Salutation_Nicknames: z.string().max(103).nullable(),
  Company_Name: z.string().max(50).nullable(),
  Sort_Name: z.string().max(125).nullable(),
});

export type VwMpContactMailNameInput = z.infer<typeof VwMpContactMailNameSchema>;
