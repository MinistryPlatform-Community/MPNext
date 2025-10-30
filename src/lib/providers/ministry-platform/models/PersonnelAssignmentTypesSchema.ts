import { z } from 'zod';

export const PersonnelAssignmentTypesSchema = z.object({
  Personnel_Assignment_Type_ID: z.number().int(),
  Personnel_Assignment_Type: z.string().max(50),
});

export type PersonnelAssignmentTypesInput = z.infer<typeof PersonnelAssignmentTypesSchema>;
