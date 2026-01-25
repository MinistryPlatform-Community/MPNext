import { z } from 'zod';

export const PerspectivesSchema = z.object({
  Perspective_ID: z.number().int(),
  Perspective: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type PerspectivesInput = z.infer<typeof PerspectivesSchema>;
