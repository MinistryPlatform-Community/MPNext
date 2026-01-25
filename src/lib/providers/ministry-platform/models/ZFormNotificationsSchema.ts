import { z } from 'zod';

export const ZFormNotificationsSchema = z.object({
  Form_ID: z.number().int(),
  Response_Message: z.number().int().nullable(),
  RM_Template: z.number().int().nullable(),
});

export type ZFormNotificationsInput = z.infer<typeof ZFormNotificationsSchema>;
