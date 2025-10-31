import { z } from 'zod';

export const EventSlotCollectionsSchema = z.object({
  Event_Slot_Collection_ID: z.number().int(),
  Collection_Name: z.string().max(50),
});

export type EventSlotCollectionsInput = z.infer<typeof EventSlotCollectionsSchema>;
