import { z } from 'zod';

export const VwMoodyDistributionRoSchema = z.object({
  Donation_Date: z.string().datetime(),
  Amount: z.number(),
  Payment_Type: z.string().max(50).nullable(),
  Item_Number: z.string().max(15).nullable(),
  Statement_Title: z.string().max(50),
  Campaign_Name: z.string().max(50).nullable(),
  Donation_ID: z.number().int(),
  Donation_Distribution_ID: z.number().int(),
  Donor_ID: z.number().int(),
  Donation_Frequency: z.string().max(50).nullable(),
  Donation_Level: z.string().max(50).nullable(),
  Batch_ID: z.number().int().nullable(),
  Pledge_ID: z.number().int().nullable(),
  Target_Event: z.string().max(75).nullable(),
  Statement_Header: z.string().max(50).nullable(),
});

export type VwMoodyDistributionRoInput = z.infer<typeof VwMoodyDistributionRoSchema>;
