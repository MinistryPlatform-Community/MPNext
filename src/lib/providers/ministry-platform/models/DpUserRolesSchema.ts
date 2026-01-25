import { z } from 'zod';

export const DpUserRolesSchema = z.object({
  User_Role_ID: z.number().int(),
  User_ID: z.number().int(),
  Role_ID: z.number().int(),
});

export type DpUserRolesInput = z.infer<typeof DpUserRolesSchema>;
