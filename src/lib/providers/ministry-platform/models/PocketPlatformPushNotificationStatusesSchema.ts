import { z } from 'zod';

export const PocketPlatformPushNotificationStatusesSchema = z.object({
  Push_Notification_Status_ID: z.number().int(),
  Status_Name: z.string().max(50),
});

export type PocketPlatformPushNotificationStatusesInput = z.infer<typeof PocketPlatformPushNotificationStatusesSchema>;
