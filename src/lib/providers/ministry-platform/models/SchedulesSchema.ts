import { z } from 'zod';

export const SchedulesSchema = z.object({
  Schedule_ID: z.number().int(),
  Schedule_Name: z.string().max(255),
  Event_ID: z.number().int(),
  Schedule_Status_ID: z.number().int(),
  Group_ID: z.number().int(),
  Primary_Contact: z.number().int().nullable(),
  Allow_Volunteer_Signup: z.boolean(),
  Accept_All_Assignments: z.boolean(),
  Reminder_Sent: z.boolean(),
  Days_Out_to_Remind: z.number().int(),
});

export type SchedulesInput = z.infer<typeof SchedulesSchema>;
