import { z } from 'zod';

export const TimeOffImpersonationSchema = z.object({
  Time_Off_Impersonation_ID: z.number().int(),
  Supervisor_User_ID: z.number().int(),
  Employee_User_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  _Added_Via_Routine: z.boolean(),
});

export type TimeOffImpersonationInput = z.infer<typeof TimeOffImpersonationSchema>;
