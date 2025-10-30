import { z } from 'zod';

export const ScheduledDonationsSchema = z.object({
  Scheduled_Donation_ID: z.number().int(),
  Donor_ID: z.number().int(),
  Donor_Account_ID: z.number().int().nullable(),
  Day_of_Month: z.unknown(),
  Amount: z.number(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Target_Event: z.number().int().nullable(),
  Notes: z.string().max(1000).nullable(),
  Payment_Type_ID: z.number().int(),
  Gift_Frequency_ID: z.number().int(),
  Number_Of_Installments: z.number().int().nullable(),
  Day_of_Month_2: z.unknown().nullable(),
  Third_Party_Note: z.string().max(1000).nullable(),
  Congregation_ID: z.number().int().nullable(),
  Memorized_Batch_ID: z.number().int().nullable(),
});

export type ScheduledDonationsInput = z.infer<typeof ScheduledDonationsSchema>;
