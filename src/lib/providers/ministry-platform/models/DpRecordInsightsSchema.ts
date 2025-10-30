import { z } from 'zod';

export const DpRecordInsightsSchema = z.object({
  Record_Insight_ID: z.number().int(),
  Title: z.string().max(50),
  Page_ID: z.number().int(),
  Sub_Page_View_ID: z.number().int().nullable(),
  Template: z.string().max(2147483647),
  View_Order: z.number().int(),
  Active: z.boolean(),
});

export type DpRecordInsightsInput = z.infer<typeof DpRecordInsightsSchema>;
