import { z } from 'zod';

export const PersonnelCategoriesSchema = z.object({
  Personnel_Category_ID: z.number().int(),
  Personnel_Category: z.string().max(50),
});

export type PersonnelCategoriesInput = z.infer<typeof PersonnelCategoriesSchema>;
