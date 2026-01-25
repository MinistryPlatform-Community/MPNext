import { z } from 'zod';

export const GroupFocusesSchema = z.object({
  Group_Focus_ID: z.number().int(),
  Group_Focus: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type GroupFocusesInput = z.infer<typeof GroupFocusesSchema>;
