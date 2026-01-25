import { z } from 'zod';

export const GroupRoleDirectionsSchema = z.object({
  Group_Role_Direction_ID: z.number().int(),
  Group_Role_Direction: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type GroupRoleDirectionsInput = z.infer<typeof GroupRoleDirectionsSchema>;
