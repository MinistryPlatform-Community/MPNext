import { z } from 'zod';

export const VwGccCovidCallSummarySchema = z.object({
  User_ID: z.number().int(),
  Made_By: z.string().max(75).nullable(),
  Planned_Contact_Title: z.string().max(50),
  Calls: z.number().int().nullable(),
  Successful: z.number().int().nullable(),
  Not_Successful: z.number().int().nullable(),
  Not_Yet_Made: z.number().int().nullable(),
});

export type VwGccCovidCallSummaryInput = z.infer<typeof VwGccCovidCallSummarySchema>;
