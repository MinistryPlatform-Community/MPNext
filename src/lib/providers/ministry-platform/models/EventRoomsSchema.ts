import { z } from 'zod';

export const EventRoomsSchema = z.object({
  Event_Room_ID: z.number().int(),
  Event_ID: z.number().int(),
  Room_ID: z.number().int(),
  Group_ID: z.number().int().nullable(),
  Default_Group_Room: z.boolean().nullable(),
  Balance_Priority: z.number().int(),
  Closed: z.boolean(),
  Auto_Close_At_Capacity: z.boolean(),
  Room_Layout_ID: z.number().int().nullable(),
  Chairs: z.number().int().nullable(),
  Tables: z.number().int().nullable(),
  Notes: z.string().max(2147483647).nullable(),
  _Approved: z.boolean().nullable(),
  Cancelled: z.boolean(),
  Checkin_Capacity: z.number().int().nullable(),
});

export type EventRoomsInput = z.infer<typeof EventRoomsSchema>;
