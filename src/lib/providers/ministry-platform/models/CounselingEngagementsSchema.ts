import { z } from 'zod';

export const CounselingEngagementsSchema = z.object({
  Counseling_Engagement_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Counselor: z.number().int().nullable(),
  Counseling_Type_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Notes: z.string().max(500).nullable(),
});

export type CounselingEngagementsInput = z.infer<typeof CounselingEngagementsSchema>;
