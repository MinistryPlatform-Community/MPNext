import { z } from 'zod';

export const EventEquipmentSchema = z.object({
  Event_Equipment_ID: z.number().int(),
  Event_ID: z.number().int(),
  Equipment_ID: z.number().int(),
  Room_ID: z.number().int().nullable(),
  Quantity: z.number().int(),
  Desired_Placement_or_Location: z.string().max(75).nullable(),
  _Approved: z.boolean().nullable(),
  Cancelled: z.boolean(),
  Notes: z.string().max(2000).nullable(),
});

export type EventEquipmentInput = z.infer<typeof EventEquipmentSchema>;
