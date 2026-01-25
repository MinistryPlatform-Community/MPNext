import { z } from 'zod';

export const RoomLayoutsSchema = z.object({
  Room_Layout_ID: z.number().int(),
  Layout_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Capacity: z.number().int().nullable(),
  Table_Count: z.number().int().nullable(),
  Chair_Count: z.number().int().nullable(),
  Setup_Minutes: z.number().int().nullable(),
  Room_ID: z.number().int().nullable(),
});

export type RoomLayoutsInput = z.infer<typeof RoomLayoutsSchema>;
