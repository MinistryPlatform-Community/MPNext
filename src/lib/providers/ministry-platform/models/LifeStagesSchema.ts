import { z } from 'zod';

export const LifeStagesSchema = z.object({
  Life_Stage_ID: z.number().int(),
  Life_Stage: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type LifeStagesInput = z.infer<typeof LifeStagesSchema>;
