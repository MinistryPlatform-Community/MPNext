import { z } from 'zod';

export const VisibilityLevelsSchema = z.object({
  Visibility_Level_ID: z.number().int(),
  Visibility_Level: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type VisibilityLevelsInput = z.infer<typeof VisibilityLevelsSchema>;
