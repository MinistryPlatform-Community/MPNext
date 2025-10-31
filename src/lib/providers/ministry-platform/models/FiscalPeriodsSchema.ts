import { z } from 'zod';

export const FiscalPeriodsSchema = z.object({
  Fiscal_Period_ID: z.number().int(),
  Fiscal_Year_ID: z.number().int(),
  Fiscal_Period_Start: z.string().datetime(),
  _Fiscal_Period_End: z.string().datetime().nullable(),
  _Fiscal_Period_Name: z.string().max(30).nullable(),
  Fiscal_Period_Notes: z.string().max(500).nullable(),
  _Fiscal_Period_Complete: z.number().nullable(),
  _Sundays: z.number().int(),
});

export type FiscalPeriodsInput = z.infer<typeof FiscalPeriodsSchema>;
