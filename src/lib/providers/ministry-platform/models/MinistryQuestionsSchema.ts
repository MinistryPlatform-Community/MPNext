import { z } from 'zod';

export const MinistryQuestionsSchema = z.object({
  Ministry_Question_ID: z.number().int(),
  Accounting_Company_ID: z.number().int(),
  Ministry_ID: z.number().int(),
  Question_Title: z.string().max(100),
  Question_Header: z.string().max(15),
  Question_Description: z.string().max(500).nullable(),
  Planning_Notes: z.string().max(4000).nullable(),
  Discontinued: z.boolean(),
  Answer_SELECT: z.string().max(4000).nullable(),
  Automation_Active: z.boolean(),
  _Deactive_Reason: z.string().max(500).nullable(),
  Answer_Format: z.string().max(2),
  Answer_Starts_After: z.string().datetime(),
  Answer_Order: z.number().int(),
  Weeks_to_Update: z.number().int(),
  On_Congregation_Summary: z.boolean(),
  On_Ministry_Summary: z.boolean(),
  On_Program_Summary: z.boolean(),
  Value_Aggregation: z.string().max(4),
  Goal_Aggregation: z.string().max(4),
  Summary_Column_Sort: z.number().int(),
});

export type MinistryQuestionsInput = z.infer<typeof MinistryQuestionsSchema>;
