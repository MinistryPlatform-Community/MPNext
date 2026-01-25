import { z } from 'zod';

export const ProgramsSchema = z.object({
  Program_ID: z.number().int(),
  Program_Name: z.string().max(130),
  Congregation_ID: z.number().int(),
  Ministry_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Program_Type_ID: z.number().int().nullable(),
  Leadership_Team: z.number().int().nullable(),
  Primary_Contact: z.number().int(),
  Priority_ID: z.number().int().nullable(),
  On_Connection_Card: z.boolean(),
  Tax_Deductible_Donations: z.boolean(),
  Statement_Title: z.string().max(50),
  Statement_Header_ID: z.number().int(),
  Allow_Online_Giving: z.boolean(),
  Online_Sort_Order: z.number().int().nullable(),
  Pledge_Campaign_ID: z.number().int().nullable(),
  Account_Number: z.string().max(25).nullable(),
  Default_Target_Event: z.number().int().nullable(),
  On_Donation_Batch_Tool: z.boolean(),
  Available_Online: z.boolean(),
  Omit_From_Engagement_Giving: z.boolean(),
  SMS_Number: z.number().int().nullable(),
  OLG_Fund: z.string().max(1000).nullable(),
  OLG_Sub_Fund: z.string().max(1000).nullable(),
  Vision2_Program_ID: z.string().max(1000).nullable(),
  Vanco_Campaign_ID: z.string().max(255).nullable(),
});

export type ProgramsInput = z.infer<typeof ProgramsSchema>;
