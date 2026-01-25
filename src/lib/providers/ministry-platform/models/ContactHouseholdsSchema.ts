import { z } from 'zod';

export const ContactHouseholdsSchema = z.object({
  Contact_Household_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Household_ID: z.number().int(),
  Household_Position_ID: z.number().int(),
  Household_Type_ID: z.number().int().nullable(),
  Primary_Family: z.boolean(),
  Notes: z.string().max(2000).nullable(),
  End_Date: z.string().datetime().nullable(),
});

export type ContactHouseholdsInput = z.infer<typeof ContactHouseholdsSchema>;
