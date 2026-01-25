import { z } from 'zod';

export const ItemPrioritiesSchema = z.object({
  Item_Priority_ID: z.number().int(),
  Priority: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type ItemPrioritiesInput = z.infer<typeof ItemPrioritiesSchema>;
