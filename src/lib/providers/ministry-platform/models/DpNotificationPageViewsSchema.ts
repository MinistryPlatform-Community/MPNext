import { z } from 'zod';

export const DpNotificationPageViewsSchema = z.object({
  Notification_Page_View_ID: z.number().int(),
  Notification_ID: z.number().int(),
  Page_View_ID: z.number().int(),
});

export type DpNotificationPageViewsInput = z.infer<typeof DpNotificationPageViewsSchema>;
