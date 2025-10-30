import { z } from 'zod';

export const ScheduleRolesSchema = z.object({
  Schedule_Role_ID: z.number().int(),
  Schedule_ID: z.number().int(),
  Group_Role_ID: z.number().int(),
  Number_Of_Volunteers: z.number().int(),
  Start_Time: z.string().nullable(),
  End_Time: z.string().nullable(),
  Notes: z.string().max(2000).nullable(),
  Role_Label: z.string().max(255).nullable(),
});

export type ScheduleRolesInput = z.infer<typeof ScheduleRolesSchema>;
