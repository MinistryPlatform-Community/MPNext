import { z } from 'zod';

export const BpCourseSubscribersSchema = z.object({
  Course_Subscriber_ID: z.number().int(),
  Course_ID: z.number().int(),
  Contact_ID: z.number().int(),
  End_Date: z.string().datetime().nullable(),
});

export type BpCourseSubscribersInput = z.infer<typeof BpCourseSubscribersSchema>;
