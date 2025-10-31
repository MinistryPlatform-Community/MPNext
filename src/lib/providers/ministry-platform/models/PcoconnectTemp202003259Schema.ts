import { z } from 'zod';

export const PcoconnectTemp202003259Schema = z.object({
  PCOConnect_Plan_Time_Person_ID: z.number().int().nullable(),
  Start_Date: z.string().datetime().nullable(),
  PCOConnect_Plan_ID: z.number().int(),
  PCOConnect_Plan_Time_ID: z.number().int(),
  PCOConnect_Person_ID: z.number().int().nullable(),
  Participant_ID: z.number().int().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Event_ID: z.number().int(),
  Event_Start_Date: z.string().datetime(),
  Event_Participant_ID: z.number().int().nullable(),
  Participation_Status_ID: z.number().int().nullable(),
  Time_In: z.string().datetime().nullable(),
  Group_ID: z.number().int().nullable(),
  Group_Participant_ID: z.number().int().nullable(),
  Group_Role_ID: z.number().int().nullable(),
  Positions: z.string().max(2147483647).nullable(),
  Statuses: z.string().max(2147483647).nullable(),
  PCO_Connect_Mode: z.number().int().nullable(),
});

export type PcoconnectTemp202003259Input = z.infer<typeof PcoconnectTemp202003259Schema>;
