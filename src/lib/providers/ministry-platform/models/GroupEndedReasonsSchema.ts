import { z } from 'zod';

export const GroupEndedReasonsSchema = z.object({
  Group_Ended_Reason_ID: z.number().int(),
  Group_Ended_Reason: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type GroupEndedReasonsInput = z.infer<typeof GroupEndedReasonsSchema>;
