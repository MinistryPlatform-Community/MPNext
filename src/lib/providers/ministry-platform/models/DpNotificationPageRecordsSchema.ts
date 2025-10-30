import { z } from 'zod';

export const DpNotificationPageRecordsSchema = z.object({
  Notification_Record_ID: z.number().int(),
  Notification_ID: z.number().int(),
  Page_ID: z.number().int(),
  Record_ID: z.number().int(),
  Record_Description: z.string().max(255),
});

export type DpNotificationPageRecordsInput = z.infer<typeof DpNotificationPageRecordsSchema>;
