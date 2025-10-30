import { z } from 'zod';

export const DpNotificationSubPageViewsSchema = z.object({
  Notification_Sub_Page_View_ID: z.number().int(),
  Notification_ID: z.number().int(),
  Sub_Page_View_ID: z.number().int(),
  Parent_Record_ID: z.number().int(),
});

export type DpNotificationSubPageViewsInput = z.infer<typeof DpNotificationSubPageViewsSchema>;
