import { z } from 'zod';

export const FiscalYearsSchema = z.object({
  Fiscal_Year_ID: z.number().int(),
  Fiscal_Year_Name: z.string().max(50),
  Fiscal_Year_Start: z.string().datetime(),
  _Fiscal_Year_End: z.string().datetime().nullable(),
  _Fiscal_Year_Complete: z.number().nullable(),
  Accounting_Company_ID: z.number().int(),
  Fiscal_Year_Notes: z.string().max(500).nullable(),
});

export type FiscalYearsInput = z.infer<typeof FiscalYearsSchema>;
