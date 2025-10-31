import { z } from 'zod';

export const FiscalPeriodAnswersSchema = z.object({
  Fiscal_Period_Answer_ID: z.number().int(),
  Fiscal_Period_ID: z.number().int(),
  Ministry_Question_ID: z.number().int(),
  Numerical_Value: z.number(),
  Congregation_ID: z.number().int().nullable(),
  Ministry_ID: z.number().int().nullable(),
  Program_ID: z.number().int().nullable(),
  Type: z.string().max(100).nullable(),
  _Date_Added: z.string().datetime(),
});

export type FiscalPeriodAnswersInput = z.infer<typeof FiscalPeriodAnswersSchema>;
