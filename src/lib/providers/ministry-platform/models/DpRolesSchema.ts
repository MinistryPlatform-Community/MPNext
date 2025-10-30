import { z } from 'zod';

export const DpRolesSchema = z.object({
  Role_ID: z.number().int(),
  Role_Name: z.string().max(35),
  Description: z.string().max(255).nullable(),
  Mass_Email_Quota: z.number().int().nullable(),
  Mass_Text_Quota: z.number().int().nullable(),
  Role_Type_ID: z.number().int().nullable(),
  Parish_Assignable: z.boolean(),
  Texting_Override: z.boolean(),
});

export type DpRolesInput = z.infer<typeof DpRolesSchema>;
