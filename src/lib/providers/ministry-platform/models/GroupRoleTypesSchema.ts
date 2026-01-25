import { z } from 'zod';

export const GroupRoleTypesSchema = z.object({
  Group_Role_Type_ID: z.number().int(),
  Group_Role_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type GroupRoleTypesInput = z.infer<typeof GroupRoleTypesSchema>;
