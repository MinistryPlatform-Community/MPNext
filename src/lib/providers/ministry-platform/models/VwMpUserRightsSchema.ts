import { z } from 'zod';

export const VwMpUserRightsSchema = z.object({
  View_ID: z.number().int().nullable(),
  Contact_Display_Name: z.string().max(125).nullable(),
  Nickname: z.string().max(50).nullable(),
  Setup_Admin: z.boolean(),
  Can_Impersonate: z.boolean(),
  Item_Type: z.string().max(21),
  Item_Name: z.string().max(109),
  Item_DB_Reference: z.string().max(1024),
  Access: z.string().max(9),
  Roles: z.number().int().nullable(),
  Role_List: z.string().max(2147483647).nullable(),
  Contact_ID: z.number().int(),
  User_ID: z.number().int(),
});

export type VwMpUserRightsInput = z.infer<typeof VwMpUserRightsSchema>;
