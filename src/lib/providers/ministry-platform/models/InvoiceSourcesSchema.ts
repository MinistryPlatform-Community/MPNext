import { z } from 'zod';

export const InvoiceSourcesSchema = z.object({
  Invoice_Source_ID: z.number().int(),
  Invoice_Source: z.string().max(50),
});

export type InvoiceSourcesInput = z.infer<typeof InvoiceSourcesSchema>;
