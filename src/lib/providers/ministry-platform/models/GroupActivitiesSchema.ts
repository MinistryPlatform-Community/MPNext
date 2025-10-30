import { z } from 'zod';

export const GroupActivitiesSchema = z.object({
  Group_Activity_ID: z.number().int(),
  Group_Activity: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type GroupActivitiesInput = z.infer<typeof GroupActivitiesSchema>;
