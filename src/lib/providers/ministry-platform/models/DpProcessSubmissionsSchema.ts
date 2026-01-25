import { z } from 'zod';

export const DpProcessSubmissionsSchema = z.object({
  Process_Submission_ID: z.number().int(),
  Submitted_By: z.number().int(),
  Date_Submitted: z.string().datetime(),
  Process_ID: z.number().int(),
  Process_Submission_Status_ID: z.number().int(),
  _Record_ID: z.number().int(),
});

export type DpProcessSubmissionsInput = z.infer<typeof DpProcessSubmissionsSchema>;
