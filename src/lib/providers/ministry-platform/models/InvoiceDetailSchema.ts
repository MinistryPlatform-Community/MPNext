import { z } from 'zod';

export const InvoiceDetailSchema = z.object({
  Invoice_Detail_ID: z.number().int(),
  Invoice_ID: z.number().int(),
  Recipient_Contact_ID: z.number().int(),
  Event_Participant_ID: z.number().int().nullable(),
  Item_Quantity: z.number().int(),
  Line_Total: z.number(),
  Product_ID: z.number().int(),
  Product_Option_Price_ID: z.number().int().nullable(),
  Item_Note: z.string().max(500).nullable(),
  Recipient_Name: z.string().max(75).nullable(),
  Recipient_Address: z.string().max(500).nullable(),
  Recipient_Email: z.string().email().max(254).nullable(),
  Recipient_Phone: z.string().nullable(),
  Deposit_Requested: z.boolean(),
});

export type InvoiceDetailInput = z.infer<typeof InvoiceDetailSchema>;
