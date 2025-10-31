import { z } from 'zod';

export const PocketPlatformAnnouncementButtonsSchema = z.object({
  Announcement_Button_ID: z.number().int(),
  Announcement_ID: z.number().int(),
  Button_Text: z.string().max(100),
  Link_URL: z.string().max(255),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Enabled: z.boolean(),
  Position: z.number().int().nullable(),
  Web_Link_URL: z.string().max(2147483647).nullable(),
});

export type PocketPlatformAnnouncementButtonsInput = z.infer<typeof PocketPlatformAnnouncementButtonsSchema>;
