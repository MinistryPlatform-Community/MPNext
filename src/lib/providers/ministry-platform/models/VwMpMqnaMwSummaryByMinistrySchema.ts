import { z } from 'zod';

export const VwMpMqnaMwSummaryByMinistrySchema = z.object({
  Period_Ministry_ID: z.number().int().nullable(),
  Years_Since: z.string().max(4000),
  Fiscal_Year_Start: z.string().datetime(),
  Periods_Since: z.string().max(4000),
  Fiscal_Period_Start: z.string().datetime(),
  Fiscal_Period_Month: z.number().int().nullable(),
  Weeks_Since: z.string().max(4000),
  Ministry_Week_Start: z.string().datetime(),
  Ministry_Week_Type: z.string().max(50),
  Ministry_Name: z.string().max(50),
  Adults_9am: z.string().max(4000).nullable(),
  Adults_11am: z.string().max(4000).nullable(),
  Children_9am: z.string().max(4000).nullable(),
  Children_11am: z.string().max(4000).nullable(),
  NextGenVol_9am: z.string().max(4000).nullable(),
  NextGenVol_11am: z.string().max(4000).nullable(),
  Ministry_ID: z.number().int().nullable(),
});

export type VwMpMqnaMwSummaryByMinistryInput = z.infer<typeof VwMpMqnaMwSummaryByMinistrySchema>;
