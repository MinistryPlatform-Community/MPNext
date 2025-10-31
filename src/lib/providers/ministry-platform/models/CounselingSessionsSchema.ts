import { z } from 'zod';

export const CounselingSessionsSchema = z.object({
  Counseling_Session_ID: z.number().int(),
  Counseling_Engagement_ID: z.number().int(),
  Session_Date: z.string().datetime(),
  Notes: z.string().max(2147483647).nullable(),
});

export type CounselingSessionsInput = z.infer<typeof CounselingSessionsSchema>;
