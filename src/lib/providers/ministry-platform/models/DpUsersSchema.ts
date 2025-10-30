import { z } from 'zod';

export const DpUsersSchema = z.object({
  User_ID: z.number().int(),
  User_Name: z.string().max(254),
  User_Email: z.string().max(254).nullable(),
  Display_Name: z.string().max(75).nullable(),
  Password: z.unknown().nullable(),
  Admin: z.boolean(),
  Publications_Manager: z.boolean(),
  Contact_ID: z.number().int(),
  Supervisor: z.number().int().nullable(),
  User_GUID: z.string().uuid(),
  Can_Impersonate: z.boolean(),
  In_Recovery: z.boolean().nullable(),
  Time_Zone: z.unknown().nullable(),
  Locale: z.unknown().nullable(),
  Theme: z.string().max(32).nullable(),
  Setup_Admin: z.boolean(),
  Read_Permitted: z.boolean(),
  Create_Permitted: z.boolean(),
  Update_Permitted: z.boolean(),
  Delete_Permitted: z.boolean(),
  Login_Attempts: z.number().int(),
  MFA_Required: z.boolean().nullable(),
});

export type DpUsersInput = z.infer<typeof DpUsersSchema>;
