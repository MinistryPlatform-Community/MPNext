import { z } from 'zod';

export const VwGccCovidCallsSchema = z.object({
  Contact_Log_ID: z.number().int(),
  Made_By: z.string().max(75).nullable(),
  Contacted_Person: z.string().max(125).nullable(),
  Planned_Contact_Title: z.string().max(50),
  Planned_Contact_ID: z.number().int(),
  Contact_Log_Type: z.string().max(50),
  Contact_Date: z.string().datetime(),
  Contact_Successful: z.boolean().nullable(),
  Contact_Result: z.string().max(14),
  Notes: z.string().max(2000),
  Original_Contact_Log_Entry: z.number().int().nullable(),
  Contact_ID: z.number().int(),
  Congregation_ID: z.number().int(),
  User_ID: z.number().int(),
});

export type VwGccCovidCallsInput = z.infer<typeof VwGccCovidCallsSchema>;
