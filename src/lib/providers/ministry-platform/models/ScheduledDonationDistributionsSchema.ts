import { z } from 'zod';

export const ScheduledDonationDistributionsSchema = z.object({
  Scheduled_Donation_Distribution_ID: z.number().int(),
  Scheduled_Donation_ID: z.number().int(),
  Amount: z.number(),
  Program_ID: z.number().int(),
  Pledge_ID: z.number().int().nullable(),
  Donation_Source_ID: z.number().int().nullable(),
  Parish_Credited_ID: z.number().int().nullable(),
  Notes: z.string().max(1000).nullable(),
  Target_Event: z.number().int().nullable(),
});

export type ScheduledDonationDistributionsInput = z.infer<typeof ScheduledDonationDistributionsSchema>;
