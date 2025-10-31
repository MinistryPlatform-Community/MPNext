import { z } from 'zod';

export const GroupCollectionsSchema = z.object({
  Group_Collection_ID: z.number().int(),
  Name: z.string().max(50),
});

export type GroupCollectionsInput = z.infer<typeof GroupCollectionsSchema>;
