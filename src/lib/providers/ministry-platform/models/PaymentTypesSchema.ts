import { z } from 'zod';

export const PaymentTypesSchema = z.object({
  Payment_Type_ID: z.number().int(),
  Payment_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Omit_Amount_On_Statement: z.boolean(),
  Is_Online: z.boolean(),
});

export type PaymentTypesInput = z.infer<typeof PaymentTypesSchema>;
