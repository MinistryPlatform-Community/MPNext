import { z } from 'zod';

export const GroupRolesSchema = z.object({
  Group_Role_ID: z.number().int(),
  Role_Title: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Group_Role_Type_ID: z.number().int(),
  Group_Role_Direction_ID: z.number().int(),
  Group_Role_Intensity_ID: z.number().int(),
  Ministry_ID: z.number().int().nullable(),
  Background_Check_Required: z.boolean(),
  Omit_From_Portal: z.boolean().nullable(),
  Manages_Volunteers: z.boolean(),
});

export type GroupRolesInput = z.infer<typeof GroupRolesSchema>;
