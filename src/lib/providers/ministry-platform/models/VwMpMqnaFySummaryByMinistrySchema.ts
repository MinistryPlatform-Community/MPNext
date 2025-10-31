import { z } from 'zod';

export const VwMpMqnaFySummaryByMinistrySchema = z.object({
  Period_Ministry_ID: z.number().int().nullable(),
  Years_Since: z.string().max(4000),
  Fiscal_Year_Start: z.string().datetime(),
  Ministry_Name: z.string().max(50),
  Adults_9am: z.string().max(4000).nullable(),
  Adults_11am: z.string().max(4000).nullable(),
  Children_9am: z.string().max(4000).nullable(),
  Children_11am: z.string().max(4000).nullable(),
  NextGenVol_9am: z.string().max(4000).nullable(),
  NextGenVol_11am: z.string().max(4000).nullable(),
  Ministry_ID: z.number().int().nullable(),
});

export type VwMpMqnaFySummaryByMinistryInput = z.infer<typeof VwMpMqnaFySummaryByMinistrySchema>;
