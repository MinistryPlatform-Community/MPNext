import { z } from 'zod';

export const AssignmentRolesSchema = z.object({
  Assignment_Role_ID: z.number().int(),
  Assignment_Role: z.string().max(50),
});

export type AssignmentRolesInput = z.infer<typeof AssignmentRolesSchema>;
