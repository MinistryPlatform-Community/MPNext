import { z } from 'zod';

export const DpUserGroupsSchema = z.object({
  User_Group_ID: z.number().int(),
  User_Group_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Moderator: z.number().int().nullable(),
});

export type DpUserGroupsInput = z.infer<typeof DpUserGroupsSchema>;
