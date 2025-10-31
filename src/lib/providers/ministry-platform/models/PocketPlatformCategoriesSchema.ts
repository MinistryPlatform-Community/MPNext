import { z } from 'zod';

export const PocketPlatformCategoriesSchema = z.object({
  Category_ID: z.number().int(),
  Category_Name: z.string().max(100),
  Position: z.number().int().nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
});

export type PocketPlatformCategoriesInput = z.infer<typeof PocketPlatformCategoriesSchema>;
