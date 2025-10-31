import { z } from 'zod';

export const BpCoursesSchema = z.object({
  Course_ID: z.number().int(),
  Title: z.string().max(255),
  Description: z.string().max(2000).nullable(),
  Enabled: z.boolean(),
  Classes_Are_Ordered: z.boolean(),
  Completed_Message: z.string().max(2147483647).nullable(),
  Event_ID: z.number().int(),
  Group_ID: z.number().int().nullable(),
  Requires_Event_Participant: z.boolean(),
  Requires_Group_Participant: z.boolean(),
  Milestone_ID: z.number().int().nullable(),
  Requires_Milestone: z.boolean(),
  Order: z.number().int().nullable(),
  Confirmation_Message_Template_ID: z.number().int().nullable(),
  Subscriber_Message_Template_ID: z.number().int().nullable(),
  Confirmation_Message_ID: z.number().int().nullable(),
  Subscriber_Message_ID: z.number().int().nullable(),
});

export type BpCoursesInput = z.infer<typeof BpCoursesSchema>;
