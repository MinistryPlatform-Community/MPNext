import { z } from 'zod';

export const BanksSchema = z.object({
  Bank_ID: z.number().int(),
  Bank_Name: z.string().max(75),
  Accounting_Company_ID: z.number().int().nullable(),
  Address_ID: z.number().int().nullable(),
  Account_Number: z.string().max(25).nullable(),
  Accounting_Company: z.string().max(25).nullable(),
});

export type BanksInput = z.infer<typeof BanksSchema>;
