import { z } from 'zod';

export const GroupSlotsSchema = z.object({
  Group_Slot_ID: z.number().int(),
  Title: z.string().max(50),
  Subtitle: z.string().max(50).nullable(),
  Date: z.string().datetime(),
  Group_ID: z.number().int(),
  Num_Slots: z.number().int(),
  Primary_Contact: z.number().int().nullable(),
  Position: z.number().int().nullable(),
});

export type GroupSlotsInput = z.infer<typeof GroupSlotsSchema>;
