import { z } from 'zod';

export const BpUserAssignmentsSchema = z.object({
  User_Assignment_ID: z.number().int(),
  Assignment_ID: z.number().int(),
  User_ID: z.number().int(),
  Date_Completed: z.string().datetime().nullable(),
});

export type BpUserAssignmentsInput = z.infer<typeof BpUserAssignmentsSchema>;
