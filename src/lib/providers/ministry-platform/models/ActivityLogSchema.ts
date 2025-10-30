import { z } from 'zod';

export const ActivityLogSchema = z.object({
  Activity_Log_ID: z.number().int(),
  Activity_Date: z.string().datetime(),
  Activity_Type: z.string().max(75),
  Record_Name: z.string().max(75),
  Contact_ID: z.number().int(),
  Household_ID: z.number().int().nullable(),
  Page_ID: z.number().int(),
  Record_ID: z.number().int(),
  Table_Name: z.string().max(50),
  Page_Name: z.string().max(50),
  Congregation_ID: z.number().int().nullable(),
  Ministry_ID: z.number().int().nullable(),
});

export type ActivityLogInput = z.infer<typeof ActivityLogSchema>;
