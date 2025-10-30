import { z } from 'zod';

export const OpportunitiesSchema = z.object({
  Opportunity_ID: z.number().int(),
  Opportunity_Title: z.string().max(50),
  Description: z.string().max(2000).nullable(),
  Group_Role_ID: z.number().int(),
  Program_ID: z.number().int(),
  Visibility_Level_ID: z.number().int(),
  Contact_Person: z.number().int(),
  Publish_Date: z.string().datetime(),
  Opportunity_Date: z.string().datetime().nullable(),
  Duration_in_Hours: z.number().int().nullable(),
  Add_to_Group: z.number().int().nullable(),
  Add_to_Event: z.number().int().nullable(),
  Required_Gender: z.number().int().nullable(),
  Minimum_Age: z.unknown().nullable(),
  Minimum_Needed: z.number().int().nullable(),
  Maximum_Needed: z.number().int().nullable(),
  Letter_Body: z.string().max(2147483647).nullable(),
  Letter_From: z.string().max(2147483647).nullable(),
  On_Connection_Card: z.boolean(),
  Shift_Start: z.string().nullable(),
  Shift_End: z.string().nullable(),
  Custom_Form: z.number().int().nullable(),
  Response_Message: z.number().int().nullable(),
  Close_Responses: z.boolean(),
  Date_To_Remind: z.string().datetime().nullable(),
  Optional_Reminder_Message: z.number().int().nullable(),
  Send_To_Heads: z.boolean().nullable(),
  _Maximum_Needed_Met: z.boolean(),
});

export type OpportunitiesInput = z.infer<typeof OpportunitiesSchema>;
