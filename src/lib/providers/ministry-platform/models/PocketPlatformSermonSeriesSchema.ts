import { z } from 'zod';

export const PocketPlatformSermonSeriesSchema = z.object({
  Sermon_Series_ID: z.number().int(),
  Title: z.string().max(100),
  Display_Title: z.string().max(100).nullable(),
  Subtitle: z.string().max(100).nullable(),
  Status_ID: z.number().int(),
  Position: z.number().int().nullable(),
  Series_UUID: z.string().uuid().nullable(),
  Last_Message_Date: z.string().datetime().nullable(),
  Series_Start_Date: z.string().datetime().nullable(),
  Enable_On_OTT: z.boolean().nullable(),
  Description: z.string().max(2147483647).nullable(),
  Web_Term_ID: z.number().int().nullable(),
  Sermon_Series_Type_ID: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Book_ID: z.number().int().nullable(),
  Latest_Sermon_Date: z.string().datetime().nullable(),
  Banner_Image_URL: z.string().max(255).nullable(),
});

export type PocketPlatformSermonSeriesInput = z.infer<typeof PocketPlatformSermonSeriesSchema>;
