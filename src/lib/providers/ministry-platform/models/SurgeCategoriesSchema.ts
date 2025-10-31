import { z } from 'zod';

export const SurgeCategoriesSchema = z.object({
  Surge_Category_ID: z.number().int(),
  Surge_Category: z.string().max(50),
});

export type SurgeCategoriesInput = z.infer<typeof SurgeCategoriesSchema>;
