import { z } from 'zod';

export const NsmStudentGraduationTypesSchema = z.object({
  Student_Graduation_Type_ID: z.number().int(),
  Student_Graduation_Type: z.string().max(50),
});

export type NsmStudentGraduationTypesInput = z.infer<typeof NsmStudentGraduationTypesSchema>;
