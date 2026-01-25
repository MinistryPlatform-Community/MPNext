import { z } from 'zod';

export const ZEventNotificationsSchema = z.object({
  Event_ID: z.number().int(),
  Registrant_Message: z.number().int().nullable(),
  RM_Template: z.number().int().nullable(),
  Optional_Reminder_Message: z.number().int().nullable(),
  OR_Template: z.number().int().nullable(),
  Attendee_Message: z.number().int().nullable(),
  AM_Template: z.number().int().nullable(),
});

export type ZEventNotificationsInput = z.infer<typeof ZEventNotificationsSchema>;
