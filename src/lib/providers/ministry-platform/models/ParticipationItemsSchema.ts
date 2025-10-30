import { z } from 'zod';

export const ParticipationItemsSchema = z.object({
  Participation_Item_ID: z.number().int(),
  Participation_Item: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ParticipationItemsInput = z.infer<typeof ParticipationItemsSchema>;
