import { z } from 'zod';

export const NsmStudentConcentrationsSchema = z.object({
  Student_Concentration_ID: z.number().int(),
  Student_Concentration: z.string().max(50),
});

export type NsmStudentConcentrationsInput = z.infer<typeof NsmStudentConcentrationsSchema>;
