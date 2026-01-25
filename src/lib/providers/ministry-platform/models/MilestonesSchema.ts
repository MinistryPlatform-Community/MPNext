import { z } from 'zod';

export const MilestonesSchema = z.object({
  Milestone_ID: z.number().int(),
  Milestone_Title: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Journey_ID: z.number().int(),
  Next_Milestone: z.number().int().nullable(),
  Follow_Up_Notes: z.string().max(2000).nullable(),
  Add_to_Event_Metrics: z.boolean(),
  Letter_Body: z.string().max(2147483647).nullable(),
  Letter_From: z.string().max(2147483647).nullable(),
  Sort_Order: z.number().int().nullable(),
  Discontinued: z.boolean(),
  On_Connection_Card: z.boolean(),
  Icon: z.string().max(50).nullable(),
  Gamify: z.boolean().nullable(),
  Call_To_Action_Button_Text: z.string().max(70).nullable(),
  Call_To_Action: z.string().max(70).nullable(),
  Scripture_on_Certificate: z.string().max(2000).nullable(),
  Show_on_Certificate: z.boolean(),
  Certificate_Person_Label: z.string().max(50).nullable(),
  Congregation_ID: z.number().int().nullable(),
});

export type MilestonesInput = z.infer<typeof MilestonesSchema>;
