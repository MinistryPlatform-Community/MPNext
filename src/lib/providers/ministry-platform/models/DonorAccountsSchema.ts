import { z } from 'zod';

export const DonorAccountsSchema = z.object({
  Donor_Account_ID: z.number().int(),
  Institution_Name: z.string().max(50),
  Account_Number: z.string().max(50),
  Routing_Number: z.string().max(50).nullable(),
  Donor_ID: z.number().int(),
  "Non-Assignable": z.boolean(),
  Account_Type_ID: z.number().int(),
  Closed: z.boolean(),
  Bank_ID: z.number().int().nullable(),
});

export type DonorAccountsInput = z.infer<typeof DonorAccountsSchema>;
