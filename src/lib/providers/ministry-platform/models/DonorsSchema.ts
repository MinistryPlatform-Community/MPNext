import { z } from 'zod';

export const DonorsSchema = z.object({
  Donor_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Statement_Frequency_ID: z.number().int(),
  Statement_Type_ID: z.number().int(),
  Statement_Method_ID: z.number().int(),
  Envelope_No: z.number().int().nullable(),
  Cancel_Envelopes: z.boolean(),
  Notes: z.string().max(500).nullable(),
  Always_Soft_Credit: z.number().int().nullable(),
  Always_Pledge_Credit: z.number().int().nullable(),
  Setup_Date: z.string().datetime(),
  First_Contact_Made: z.boolean().nullable(),
  _First_Donation_Date: z.string().datetime().nullable(),
  _Last_Donation_Date: z.string().datetime().nullable(),
  Donation_Frequency_ID: z.number().int().nullable(),
  Donation_Level_ID: z.number().int().nullable(),
  Donor_Code: z.string().max(16).nullable(),
});

export type DonorsInput = z.infer<typeof DonorsSchema>;
