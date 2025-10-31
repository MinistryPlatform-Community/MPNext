import { z } from 'zod';

export const MinistryWeeksSchema = z.object({
  Ministry_Week_ID: z.number().int(),
  Fiscal_Period_ID: z.number().int(),
  Ministry_Week_Start: z.string().datetime(),
  _Ministry_Week_End: z.string().datetime().nullable(),
  Ministry_Week_Type_ID: z.number().int().nullable(),
  Ministry_Week_Notes: z.string().max(500).nullable(),
  Days_in_Week: z.number().int().nullable(),
  Recompile_Answers: z.boolean(),
});

export type MinistryWeeksInput = z.infer<typeof MinistryWeeksSchema>;
