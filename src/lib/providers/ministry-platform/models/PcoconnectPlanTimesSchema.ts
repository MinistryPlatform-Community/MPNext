import { z } from 'zod';

export const PcoconnectPlanTimesSchema = z.object({
  PCOConnect_Plan_Time_ID: z.number().int(),
  Plan_Time_ID: z.number().int().nullable(),
  PCOConnect_Plan_ID: z.number().int().nullable(),
  Plan_ID: z.number().int().nullable(),
  Plan_Time_Name: z.string().max(175).nullable(),
  Time_Type: z.string().max(175).nullable(),
  Start_Date: z.string().datetime().nullable(),
  End_Date: z.string().datetime().nullable(),
  Event_ID: z.number().int().nullable(),
  Status: z.string().max(50).nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
});

export type PcoconnectPlanTimesInput = z.infer<typeof PcoconnectPlanTimesSchema>;
