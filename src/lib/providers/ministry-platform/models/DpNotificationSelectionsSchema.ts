import { z } from 'zod';

export const DpNotificationSelectionsSchema = z.object({
  Notification_Selection_ID: z.number().int(),
  Notification_ID: z.number().int(),
  Selection_ID: z.number().int(),
});

export type DpNotificationSelectionsInput = z.infer<typeof DpNotificationSelectionsSchema>;
