import { z } from 'zod';

export const DpUserUserGroupsSchema = z.object({
  User_User_Group_ID: z.number().int(),
  User_ID: z.number().int(),
  User_Group_ID: z.number().int(),
});

export type DpUserUserGroupsInput = z.infer<typeof DpUserUserGroupsSchema>;
