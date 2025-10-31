import { z } from 'zod';

export const BpCourseClassesSchema = z.object({
  Class_ID: z.number().int(),
  Course_ID: z.number().int(),
  Title: z.string().max(255),
  Subtitle: z.string().max(255).nullable(),
  Description: z.string().max(2000).nullable(),
  Page_Html: z.string().max(2147483647).nullable(),
  Enabled: z.boolean(),
  Completed_Message: z.string().max(2147483647).nullable(),
  Event_ID: z.number().int(),
  Order: z.number().int().nullable(),
  Unlock_on_Event_Start: z.boolean(),
  Confirmation_Message_Template_ID: z.number().int().nullable(),
  Subscriber_Message_Template_ID: z.number().int().nullable(),
  Confirmation_Message_ID: z.number().int().nullable(),
  Subscriber_Message_ID: z.number().int().nullable(),
});

export type BpCourseClassesInput = z.infer<typeof BpCourseClassesSchema>;
