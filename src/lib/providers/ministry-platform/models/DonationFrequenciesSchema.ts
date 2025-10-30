import { z } from 'zod';

export const DonationFrequenciesSchema = z.object({
  Donation_Frequency_ID: z.number().int(),
  Donation_Frequency: z.string().max(50),
  Evaluation_Days: z.number().int(),
  Evaluation_Order: z.number().int(),
  Minimum_Donations: z.number().int(),
  Evaluation_Delay: z.number().int(),
});

export type DonationFrequenciesInput = z.infer<typeof DonationFrequenciesSchema>;
