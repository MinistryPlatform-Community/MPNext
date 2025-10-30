import { z } from 'zod';

export const ResponsesSchema = z.object({
  Response_ID: z.number().int(),
  Response_Date: z.string().datetime(),
  Opportunity_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Comments: z.string().max(2000).nullable(),
  First_Name: z.string().max(50).nullable(),
  Last_Name: z.string().max(50).nullable(),
  Email: z.string().max(254).nullable(),
  Phone: z.string().nullable(),
  Response_Result_ID: z.number().int().nullable(),
  Closed: z.boolean(),
  Event_ID: z.number().int().nullable(),
  Notification_Sent: z.boolean(),
});

export type ResponsesInput = z.infer<typeof ResponsesSchema>;
