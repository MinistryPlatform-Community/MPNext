import { z } from 'zod';

export const PocketPlatformLivestreamsSchema = z.object({
  Livestream_ID: z.number().int(),
  Stream_Title: z.string().max(150),
  Description: z.string().max(500).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime(),
  Stream_URL: z.string().max(512).nullable(),
  Sort_Order: z.number().int().nullable(),
  Sermon_ID: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
});

export type PocketPlatformLivestreamsInput = z.infer<typeof PocketPlatformLivestreamsSchema>;
