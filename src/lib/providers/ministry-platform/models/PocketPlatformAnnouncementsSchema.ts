import { z } from 'zod';

export const PocketPlatformAnnouncementsSchema = z.object({
  Announcement_ID: z.number().int(),
  Announcement_Title: z.string().max(100).nullable(),
  Body: z.string().max(2147483647).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Enabled: z.boolean(),
  Link_URL: z.string().max(255).nullable(),
  Position: z.number().int().nullable(),
  Announcement_Type_ID: z.number().int(),
  Announcement_Sort_Order: z.number().int().nullable(),
  Event_ID: z.number().int().nullable(),
  Group_ID: z.number().int().nullable(),
  Opportunity_ID: z.number().int().nullable(),
  Web_Link_URL: z.string().max(255).nullable(),
  Dismissible: z.boolean().nullable(),
  Show_In_App: z.boolean(),
  Show_Image_In_App: z.boolean(),
  Show_In_Email: z.boolean(),
  Show_Image_In_Email: z.boolean(),
  Show_On_Web: z.boolean(),
  Show_Image_On_Web: z.boolean(),
  Show_Image_Only: z.boolean(),
  Congregation_ID: z.number().int().nullable(),
  Audience_ID: z.number().int().nullable(),
});

export type PocketPlatformAnnouncementsInput = z.infer<typeof PocketPlatformAnnouncementsSchema>;
