import { z } from 'zod';

export const DonationSourcesSchema = z.object({
  Donation_Source_ID: z.number().int(),
  Donation_Source: z.string().max(128),
  Code: z.string().max(24).nullable(),
  Description: z.string().max(2000).nullable(),
  Campaign_ID: z.number().int().nullable(),
  Active: z.boolean(),
});

export type DonationSourcesInput = z.infer<typeof DonationSourcesSchema>;
