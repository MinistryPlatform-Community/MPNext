import { z } from 'zod';

export const PocketPlatformPushNotificationsSchema = z.object({
  Push_Notification_ID: z.number().int(),
  Message_Title: z.string().max(75),
  Message_Body: z.string().max(1000),
  User_ID: z.number().int(),
  Sent_Date: z.string().datetime().nullable(),
  Scheduled_Date: z.string().datetime().nullable(),
  Status_ID: z.number().int(),
  To_User_ID: z.number().int().nullable(),
  Action: z.string().max(225).nullable(),
  Payload: z.string().max(500).nullable(),
  Additional_Information: z.string().max(500).nullable(),
  App_ID: z.number().int().nullable(),
});

export type PocketPlatformPushNotificationsInput = z.infer<typeof PocketPlatformPushNotificationsSchema>;
