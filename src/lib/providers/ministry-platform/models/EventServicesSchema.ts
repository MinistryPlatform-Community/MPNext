import { z } from 'zod';

export const EventServicesSchema = z.object({
  Event_Service_ID: z.number().int(),
  Event_ID: z.number().int(),
  Service_ID: z.number().int(),
  Quantity: z.number().int().nullable(),
  Location_For_Service: z.string().max(50).nullable(),
  Notes: z.string().max(2000).nullable(),
  Cancelled: z.boolean(),
  _Approved: z.boolean().nullable(),
});

export type EventServicesInput = z.infer<typeof EventServicesSchema>;
