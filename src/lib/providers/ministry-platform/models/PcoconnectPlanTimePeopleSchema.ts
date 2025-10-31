import { z } from 'zod';

export const PcoconnectPlanTimePeopleSchema = z.object({
  PCOConnect_Plan_Time_Person_ID: z.number().int(),
  Plan_Time_ID: z.number().int().nullable(),
  PCOConnect_Plan_Time_ID: z.number().int().nullable(),
  Person_ID: z.number().int().nullable(),
  PCOConnect_Person_ID: z.number().int().nullable(),
  Status: z.string().max(25).nullable(),
  PCOConnect_Team_ID: z.number().int().nullable(),
  Position: z.string().max(175).nullable(),
  Event_Participant_ID: z.number().int().nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
});

export type PcoconnectPlanTimePeopleInput = z.infer<typeof PcoconnectPlanTimePeopleSchema>;
