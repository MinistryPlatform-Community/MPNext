import { z } from 'zod';

export const ShipmentRecipientsSchema = z.object({
  Recipient_ID: z.number().int(),
  Subscriber_ID: z.number().int(),
  Recipient_Contact: z.number().int().nullable(),
  Recipient_Name: z.string().max(125).nullable(),
  Product_Option_Price_ID: z.number().int(),
  Cancel_Recipient: z.boolean(),
});

export type ShipmentRecipientsInput = z.infer<typeof ShipmentRecipientsSchema>;
