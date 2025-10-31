import { z } from 'zod';

export const PocketPlatformSermonLinksSchema = z.object({
  Sermon_Link_ID: z.number().int(),
  Sermon_ID: z.number().int(),
  Link_Type_ID: z.number().int(),
  Link_URL: z.string().max(1000).nullable(),
  Podcast_Description: z.string().max(2147483647).nullable(),
  Status_ID: z.number().int(),
  Use_In_Audio_Podcast: z.boolean().nullable(),
  Use_in_Video_Podcast: z.boolean().nullable(),
  File_Size: z.string().max(10).nullable(),
  File_Units: z.string().max(10).nullable(),
  File_Duration: z.string().max(10).nullable(),
  Position: z.number().int().nullable(),
  Video_Duration: z.number().int().nullable(),
  HLS_Thumbnail: z.string().max(500).nullable(),
  Video_Quality: z.string().max(4).nullable(),
});

export type PocketPlatformSermonLinksInput = z.infer<typeof PocketPlatformSermonLinksSchema>;
