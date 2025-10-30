import { z } from 'zod';

export const LocationCategoriesSchema = z.object({
  Location_Category_ID: z.number().int(),
  Location_Category: z.string().max(100),
});

export type LocationCategoriesInput = z.infer<typeof LocationCategoriesSchema>;
