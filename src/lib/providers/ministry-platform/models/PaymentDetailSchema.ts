import { z } from 'zod';

export const PaymentDetailSchema = z.object({
  Payment_Detail_ID: z.number().int(),
  Payment_ID: z.number().int(),
  Payment_Amount: z.number(),
  Invoice_Detail_ID: z.number().int(),
});

export type PaymentDetailInput = z.infer<typeof PaymentDetailSchema>;
