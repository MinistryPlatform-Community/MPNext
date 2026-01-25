import { z } from 'zod';

export const ZOppNotificationsSchema = z.object({
  Opportunity_ID: z.number().int(),
  Response_Message: z.number().int().nullable(),
  RM_Template: z.number().int().nullable(),
  Optional_Reminder_Message: z.number().int().nullable(),
  OR_Template: z.number().int().nullable(),
});

export type ZOppNotificationsInput = z.infer<typeof ZOppNotificationsSchema>;
