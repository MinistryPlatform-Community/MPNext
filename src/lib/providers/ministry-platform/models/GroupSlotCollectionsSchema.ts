import { z } from 'zod';

export const GroupSlotCollectionsSchema = z.object({
  Group_Slot_Collection_ID: z.number().int(),
  Collection_Name: z.string().max(50),
});

export type GroupSlotCollectionsInput = z.infer<typeof GroupSlotCollectionsSchema>;
