import { z } from 'zod';

export const PocketPlatformSermonSeriesCategoriesSchema = z.object({
  Sermon_Series_Category_ID: z.number().int(),
  Series_ID: z.number().int(),
  Category_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  Position: z.number().int().nullable(),
  End_Date: z.string().datetime().nullable(),
});

export type PocketPlatformSermonSeriesCategoriesInput = z.infer<typeof PocketPlatformSermonSeriesCategoriesSchema>;
