import { z } from 'zod';

export const GroupParticipantsSchema = z.object({
  Group_Participant_ID: z.number().int(),
  Group_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Group_Role_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Employee_Role: z.boolean(),
  Hours_Per_Week: z.number().int().nullable(),
  Notes: z.string().max(500).nullable(),
  Need_Book: z.boolean(),
  Email_Opt_Out: z.boolean(),
  Share_With_Group: z.boolean(),
  Auto_Promote: z.boolean(),
  _First_Attendance: z.string().datetime().nullable(),
  _Second_Attendance: z.string().datetime().nullable(),
  _Third_Attendance: z.string().datetime().nullable(),
  _Last_Attendance: z.string().datetime().nullable(),
  Show_Email: z.boolean(),
  Show_Phone: z.boolean(),
  Show_Last_Name: z.boolean(),
  Show_Photo: z.boolean(),
  _Show_Birthday: z.boolean(),
  _Show_Email: z.boolean(),
  _Show_Home_Phone: z.boolean(),
  _Show_Mobile_Phone: z.boolean(),
  _Show_Address: z.boolean(),
  _Show_Photo: z.boolean(),
});

export type GroupParticipantsInput = z.infer<typeof GroupParticipantsSchema>;
