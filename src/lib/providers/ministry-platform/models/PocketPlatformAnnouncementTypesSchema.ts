import { z } from 'zod';

export const PocketPlatformAnnouncementTypesSchema = z.object({
  Announcement_Type_ID: z.number().int(),
  Title: z.string().max(50),
  Sort_Order: z.number().int().nullable(),
  Enabled: z.boolean(),
});

export type PocketPlatformAnnouncementTypesInput = z.infer<typeof PocketPlatformAnnouncementTypesSchema>;
