import { z } from 'zod';

export const GroupCollectionGroupsSchema = z.object({
  Name: z.string().max(50),
  Group_Collection_Group_ID: z.number().int(),
  Group_Collection_ID: z.number().int(),
  Group_ID: z.number().int(),
  Position: z.number().int(),
});

export type GroupCollectionGroupsInput = z.infer<typeof GroupCollectionGroupsSchema>;
