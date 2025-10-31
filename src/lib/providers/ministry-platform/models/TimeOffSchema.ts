import { z } from 'zod';

export const TimeOffSchema = z.object({
  Time_Off_ID: z.number().int(),
  Staff_Member: z.number().int(),
  Time_Off_Type_ID: z.number().int(),
  Request_Status_ID: z.number().int().nullable(),
  First_Workday_Missed: z.string().datetime(),
  Last_Workday_Missed: z.string().datetime(),
  Return_Date: z.string().datetime(),
  Work_Hours_Missed: z.number().int(),
  Notes: z.string().max(500).nullable(),
  _Approved: z.boolean().nullable(),
  Supervisor_Note: z.string().max(500).nullable(),
  HR_Note: z.string().max(500).nullable(),
});

export type TimeOffInput = z.infer<typeof TimeOffSchema>;
