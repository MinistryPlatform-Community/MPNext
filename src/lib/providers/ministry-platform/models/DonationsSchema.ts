import { z } from 'zod';

export const DonationsSchema = z.object({
  Donation_ID: z.number().int(),
  Donor_ID: z.number().int(),
  Donation_Amount: z.number(),
  Donation_Date: z.string().datetime(),
  Payment_Type_ID: z.number().int(),
  Item_Number: z.string().max(15).nullable(),
  Batch_ID: z.number().int().nullable(),
  Notes: z.string().max(500).nullable(),
  Donor_Account_ID: z.number().int().nullable(),
  Anonymous: z.boolean(),
  Transaction_Code: z.string().max(50).nullable(),
  Subscription_Code: z.string().max(50).nullable(),
  Gateway_Response: z.string().max(500).nullable(),
  Processed: z.boolean().nullable(),
  Currency: z.string().max(25).nullable(),
  Receipted: z.boolean(),
  Invoice_Number: z.string().max(25).nullable(),
  Receipt_Number: z.number().int().nullable(),
  Original_MICR: z.string().max(100).nullable(),
  Position: z.number().int().nullable(),
  OCR_Data: z.string().max(1000).nullable(),
  Third_Party_Note: z.string().max(2147483647).nullable(),
  Statement_ID: z.number().int().nullable(),
  _Last_Statement_Review: z.string().datetime().nullable(),
  Multiple_Donor_Match: z.boolean(),
  _Is_Check_Scan: z.boolean().nullable(),
});

export type DonationsInput = z.infer<typeof DonationsSchema>;
