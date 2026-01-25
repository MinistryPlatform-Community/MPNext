import { z } from 'zod';

export const AccountTypesSchema = z.object({
  Account_Type_ID: z.number().int(),
  Account_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type AccountTypesInput = z.infer<typeof AccountTypesSchema>;
