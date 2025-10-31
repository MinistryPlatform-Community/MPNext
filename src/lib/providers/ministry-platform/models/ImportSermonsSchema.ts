import { z } from 'zod';

export const ImportSermonsSchema = z.object({
  Title: z.string().max(200).nullable(),
  Description: z.string().max(1200).nullable(),
  Sermon_Date: z.string().datetime().nullable(),
  WP_Post_ID: z.number().int(),
  WP_Category_ID: z.number().int().nullable(),
  Speaker_ID: z.number().int().nullable(),
  Video_URL: z.string().max(200).nullable(),
  Audio_URL: z.string().max(200).nullable(),
  Info_URL: z.string().max(200).nullable(),
  Sermon_ID: z.number().int().nullable(),
});

export type ImportSermonsInput = z.infer<typeof ImportSermonsSchema>;
