import { z } from 'zod';

export const VwMpProjectedScheduledDonationsSchema = z.object({
  ID: z.number().int().nullable(),
  Scheduled_Donation_ID: z.number().int(),
  Donor_ID: z.number().int(),
  Congregation_ID: z.number().int().nullable(),
  Donor_Account_ID: z.number().int().nullable(),
  Amount: z.number(),
  Day_of_Month_1: z.unknown(),
  Day_of_Month_2: z.unknown().nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Target_Event: z.number().int().nullable(),
  Notes: z.string().max(1000).nullable(),
  Payment_Type_ID: z.number().int(),
  Gift_Frequency_ID: z.number().int(),
  Gift_Frequency: z.string().max(128),
  Number_Of_Installments: z.number().int().nullable(),
  Third_Party_Note: z.string().max(1000).nullable(),
  Projected_Donation_Date: z.string().datetime().nullable(),
});

export type VwMpProjectedScheduledDonationsInput = z.infer<typeof VwMpProjectedScheduledDonationsSchema>;
