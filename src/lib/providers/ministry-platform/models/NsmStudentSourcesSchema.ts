import { z } from 'zod';

export const NsmStudentSourcesSchema = z.object({
  Student_Source_ID: z.number().int(),
  Student_Source: z.string().max(50),
});

export type NsmStudentSourcesInput = z.infer<typeof NsmStudentSourcesSchema>;
