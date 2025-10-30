import { z } from 'zod';

export const EventGroupsSchema = z.object({
  Event_Group_ID: z.number().int(),
  Event_ID: z.number().int(),
  Group_ID: z.number().int(),
  Room_ID: z.number().int().nullable(),
  Closed: z.boolean().nullable(),
  Curriculum_ID: z.number().int().nullable(),
});

export type EventGroupsInput = z.infer<typeof EventGroupsSchema>;
