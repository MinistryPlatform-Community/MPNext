import { z } from 'zod';

export const DonationLevelsSchema = z.object({
  Donation_Level_ID: z.number().int(),
  Donation_Level: z.string().max(50).nullable(),
  Evaluation_Days: z.number().int(),
  Evaluation_Order: z.number().int(),
  Minimum_Donations: z.number(),
  Evaluation_Delay: z.number().int(),
});

export type DonationLevelsInput = z.infer<typeof DonationLevelsSchema>;
