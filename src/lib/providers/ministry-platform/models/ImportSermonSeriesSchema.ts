import { z } from 'zod';

export const ImportSermonSeriesSchema = z.object({
  Title: z.string().max(100).nullable(),
  Description: z.string().max(1200).nullable(),
  Start_Date: z.string().datetime().nullable(),
  WP_Category_ID: z.number().int(),
  Graphic_URL: z.string().max(150).nullable(),
  Series_ID: z.number().int().nullable(),
});

export type ImportSermonSeriesInput = z.infer<typeof ImportSermonSeriesSchema>;
