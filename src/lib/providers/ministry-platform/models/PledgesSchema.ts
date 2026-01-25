import { z } from 'zod';

export const PledgesSchema = z.object({
  Pledge_ID: z.number().int(),
  Donor_ID: z.number().int(),
  Pledge_Campaign_ID: z.number().int(),
  Pledge_Status_ID: z.number().int(),
  Total_Pledge: z.number(),
  Installments_Planned: z.number().int(),
  Installments_Per_Year: z.number().int(),
  _Installment_Amount: z.number().nullable(),
  First_Installment_Date: z.string().datetime(),
  Notes: z.string().max(500).nullable(),
  Beneficiary: z.string().max(50).nullable(),
  Trip_Leader: z.boolean(),
  Currency: z.string().max(25).nullable(),
  Parish_Credited_ID: z.number().int().nullable(),
  Parish_Credited_Unknown: z.boolean(),
  _Gift_Frequency: z.number().int().nullable(),
  Donation_Source_ID: z.number().int().nullable(),
  Send_Pledge_Statement: z.boolean(),
  _Original_Amount: z.number().nullable(),
  _Last_Installment_Date: z.string().datetime().nullable(),
  Batch_ID: z.number().int().nullable(),
});

export type PledgesInput = z.infer<typeof PledgesSchema>;
