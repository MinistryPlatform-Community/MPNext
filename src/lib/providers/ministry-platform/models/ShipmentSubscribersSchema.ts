import { z } from 'zod';

export const ShipmentSubscribersSchema = z.object({
  Subscriber_ID: z.number().int(),
  Shipment_ID: z.number().int(),
  Subscriber_Contact: z.number().int(),
  Event_Participant_ID: z.number().int().nullable(),
  Shipping_Address: z.string().max(500).nullable(),
  Will_Pickup: z.boolean(),
  Cancel_Subscription: z.boolean(),
  Complete: z.boolean(),
});

export type ShipmentSubscribersInput = z.infer<typeof ShipmentSubscribersSchema>;
