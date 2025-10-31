import { z } from 'zod';

export const CounselingTypesSchema = z.object({
  Counseling_Type_ID: z.number().int(),
  Counseling_Type: z.string().max(50),
  Notes: z.string().max(255).nullable(),
});

export type CounselingTypesInput = z.infer<typeof CounselingTypesSchema>;
