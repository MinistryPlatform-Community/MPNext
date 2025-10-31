import { z } from 'zod';

export const VwNwccConnectCardEventSummarySchema = z.object({
  Event_ID: z.number().int(),
  Event_Start_Date: z.string().datetime(),
  Event_Title: z.string().max(75),
  Event_Type: z.string().max(50),
  Participants: z.number().int(),
  Households: z.number().int(),
  Adults: z.number().int(),
  Minors: z.number().int(),
  Responses: z.number().int(),
  Prayer: z.number().int(),
  Comment: z.number().int(),
  First_Attendance_Ever: z.number().int(),
  Second_Attendance_Ever: z.number().int(),
  New_Participant_Record: z.number().int(),
});

export type VwNwccConnectCardEventSummaryInput = z.infer<typeof VwNwccConnectCardEventSummarySchema>;
