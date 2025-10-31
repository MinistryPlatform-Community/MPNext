import { z } from 'zod';

export const NsmStudentStatusesSchema = z.object({
  Student_Status_ID: z.number().int(),
  Student_Status: z.string().max(50),
});

export type NsmStudentStatusesInput = z.infer<typeof NsmStudentStatusesSchema>;
