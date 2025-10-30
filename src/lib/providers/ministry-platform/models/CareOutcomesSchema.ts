import { z } from 'zod';

export const CareOutcomesSchema = z.object({
  Care_Outcome_ID: z.number().int(),
  Care_Outcome: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type CareOutcomesInput = z.infer<typeof CareOutcomesSchema>;
