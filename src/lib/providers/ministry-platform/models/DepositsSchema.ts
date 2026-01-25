import { z } from 'zod';

export const DepositsSchema = z.object({
  Deposit_ID: z.number().int(),
  Deposit_Name: z.string().max(75),
  Deposit_Total: z.number(),
  Deposit_Date: z.string().datetime(),
  Account_Number: z.string().max(30),
  Batch_Count: z.number().int(),
  Exported: z.boolean(),
  Notes: z.string().max(500).nullable(),
  Congregation_ID: z.number().int().nullable(),
  Send_To_Accounting: z.boolean(),
});

export type DepositsInput = z.infer<typeof DepositsSchema>;
