import { z } from 'zod';

export const InvoiceStatusesSchema = z.object({
  Invoice_Status_ID: z.number().int(),
  Invoice_Status: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type InvoiceStatusesInput = z.infer<typeof InvoiceStatusesSchema>;
