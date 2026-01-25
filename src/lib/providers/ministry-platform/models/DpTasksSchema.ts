import { z } from 'zod';

export const DpTasksSchema = z.object({
  Task_ID: z.number().int(),
  Title: z.string().max(75).nullable(),
  Author_User_ID: z.number().int(),
  Assigned_User_ID: z.number().int().nullable(),
  Start_Date: z.string().datetime().nullable(),
  End_Date: z.string().datetime().nullable(),
  Completed: z.boolean(),
  Description: z.string().max(2147483647).nullable(),
  _Record_ID: z.number().int().nullable(),
  _Process_Submission_ID: z.number().int().nullable(),
  _Process_Step_ID: z.number().int().nullable(),
  _Rejected: z.boolean(),
  _Escalated: z.boolean(),
  _Record_Description: z.string().max(256).nullable(),
  _Table_Name: z.string().max(50).nullable(),
  _Hidden: z.boolean(),
  Assigned_User_Group_ID: z.number().int().nullable(),
  Completion_Rule_ID: z.number().int().nullable(),
});

export type DpTasksInput = z.infer<typeof DpTasksSchema>;
