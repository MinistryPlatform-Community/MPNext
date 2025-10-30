import { z } from 'zod';

export const DpProcessStepsSchema = z.object({
  Process_Step_ID: z.number().int(),
  Step_Name: z.string().max(50),
  Instructions: z.string().max(500).nullable(),
  Process_Step_Type_ID: z.number().int(),
  Escalation_Only: z.boolean(),
  Order: z.number().int(),
  Process_ID: z.number().int(),
  Specific_User: z.number().int().nullable(),
  Supervisor_User: z.boolean(),
  Lookup_User_Field: z.string().max(1000).nullable(),
  Escalate_to_Step: z.number().int().nullable(),
  Task_Deadline: z.number().int().nullable(),
  Email_Template: z.number().int().nullable(),
  To_Specific_Contact: z.number().int().nullable(),
  Email_To_Contact_Field: z.string().max(1000).nullable(),
  SQL_Statement: z.string().max(1000).nullable(),
  Webhook_ID: z.number().int().nullable(),
  Text_Template: z.number().int().nullable(),
  Text_To_Contact_Field: z.string().max(1000).nullable(),
  Specific_User_Group_ID: z.number().int().nullable(),
  Completion_Rule_ID: z.number().int().nullable(),
});

export type DpProcessStepsInput = z.infer<typeof DpProcessStepsSchema>;
