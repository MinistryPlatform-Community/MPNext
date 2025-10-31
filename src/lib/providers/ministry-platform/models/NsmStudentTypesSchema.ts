import { z } from 'zod';

export const NsmStudentTypesSchema = z.object({
  Student_Type_ID: z.number().int(),
  Student_Type: z.string().max(50),
});

export type NsmStudentTypesInput = z.infer<typeof NsmStudentTypesSchema>;
