import { z } from 'zod';

export const PrioritiesSchema = z.object({
  Priority_ID: z.number().int(),
  Priority_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Perspective_ID: z.number().int(),
  Parent_Priority_ID: z.number().int().nullable(),
});

export type PrioritiesInput = z.infer<typeof PrioritiesSchema>;
