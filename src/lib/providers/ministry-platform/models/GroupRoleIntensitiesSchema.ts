import { z } from 'zod';

export const GroupRoleIntensitiesSchema = z.object({
  Group_Role_Intensity_ID: z.number().int(),
  Group_Role_Intensity: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type GroupRoleIntensitiesInput = z.infer<typeof GroupRoleIntensitiesSchema>;
