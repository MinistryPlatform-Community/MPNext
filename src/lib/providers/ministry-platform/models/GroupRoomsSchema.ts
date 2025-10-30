import { z } from 'zod';

export const GroupRoomsSchema = z.object({
  Group_Room_ID: z.number().int(),
  Group_ID: z.number().int(),
  Room_ID: z.number().int(),
  Default_Room: z.boolean(),
  Discontinued: z.boolean(),
});

export type GroupRoomsInput = z.infer<typeof GroupRoomsSchema>;
