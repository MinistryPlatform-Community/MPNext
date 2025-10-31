import { z } from 'zod';

export const PocketPlatformLivestreamsBackupSchema = z.object({
  Livestream_Object_ID: z.number().int(),
  Livestream_Title: z.string().max(150),
  Livestream_Description: z.string().max(500),
  Livestream_Source: z.string().max(200),
  Livestream_Active: z.boolean(),
  Sort_Order: z.number().int().nullable(),
});

export type PocketPlatformLivestreamsBackupInput = z.infer<typeof PocketPlatformLivestreamsBackupSchema>;
