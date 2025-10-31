import { z } from 'zod';

export const PocketPlatformSermonsSchema = z.object({
  Sermon_ID: z.number().int(),
  Series_ID: z.number().int(),
  Congregation_ID: z.number().int(),
  Service_Type_ID: z.number().int().nullable(),
  Title: z.string().max(100),
  Subtitle: z.string().max(100).nullable(),
  Description: z.string().max(2147483647).nullable(),
  Sermon_Date: z.string().datetime(),
  Speaker_ID: z.number().int(),
  Scripture_Links: z.string().max(255).nullable(),
  Position: z.number().int().nullable(),
  Use_For_Podcast: z.boolean().nullable(),
  Status_ID: z.number().int(),
  Notes_Form_ID: z.number().int().nullable(),
  Sermon_UUID: z.string().uuid().nullable(),
  Web_Post_ID: z.number().int().nullable(),
  Processing_Complete: z.boolean(),
  Book_ID: z.number().int().nullable(),
});

export type PocketPlatformSermonsInput = z.infer<typeof PocketPlatformSermonsSchema>;
