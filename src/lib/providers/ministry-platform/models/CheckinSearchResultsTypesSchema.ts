import { z } from 'zod';

export const CheckinSearchResultsTypesSchema = z.object({
  Checkin_Search_Results_Type_ID: z.number().int(),
  Search_Result_Type: z.string().max(50),
});

export type CheckinSearchResultsTypesInput = z.infer<typeof CheckinSearchResultsTypesSchema>;
