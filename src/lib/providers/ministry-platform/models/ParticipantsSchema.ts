import { z } from 'zod';

export const ParticipantsSchema = z.object({
  Participant_ID: z.number().int(),
  Red_Flag_Notes: z.string().max(254).nullable(),
  Contact_ID: z.number().int(),
  Participant_Type_ID: z.number().int(),
  Member_Status_ID: z.number().int().nullable(),
  Participant_Engagement_ID: z.number().int().nullable(),
  Participant_Start_Date: z.string().datetime(),
  Participant_End_Date: z.string().datetime().nullable(),
  Notes: z.string().max(1000).nullable(),
  _First_Attendance_Ever: z.string().datetime().nullable(),
  _Second_Attendance_Ever: z.string().datetime().nullable(),
  _Third_Attendance_Ever: z.string().datetime().nullable(),
  _Last_Attendance_Ever: z.string().datetime().nullable(),
  _Background_Check_Type: z.string().max(128).nullable(),
  _Background_Check_Status: z.string().max(50).nullable(),
  _Background_Check_Date: z.string().datetime().nullable(),
  Church_of_Record: z.number().int().nullable(),
  Baptism_Parish_Name: z.string().max(75).nullable(),
  Baptism_Parish_Address: z.string().max(254).nullable(),
  Birth_Certificate_Address: z.string().max(254).nullable(),
  Birth_Certificate_City: z.string().max(254).nullable(),
  Birth_Certificate_State: z.string().max(15).nullable(),
});

export type ParticipantsInput = z.infer<typeof ParticipantsSchema>;
