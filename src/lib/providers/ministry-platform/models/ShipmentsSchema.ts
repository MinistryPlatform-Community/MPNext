import { z } from 'zod';

export const ShipmentsSchema = z.object({
  Shipment_ID: z.number().int(),
  Shipment_Date: z.string().datetime(),
  Event_ID: z.number().int(),
  Shared_Packing_List: z.string().max(2147483647).nullable(),
  Subscription_Closed: z.boolean(),
});

export type ShipmentsInput = z.infer<typeof ShipmentsSchema>;
