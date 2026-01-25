import { z } from 'zod';

export const GroupTypesSchema = z.object({
  Group_Type_ID: z.number().int(),
  Group_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Default_Role: z.number().int(),
  Activity_Log_Start_Date: z.boolean(),
  Show_On_Group_Finder: z.boolean(),
  Show_On_MPMobile: z.boolean(),
  Omit_From_Engagement_Group_Life: z.boolean(),
  Volunteer_Group: z.boolean(),
});

export type GroupTypesInput = z.infer<typeof GroupTypesSchema>;
