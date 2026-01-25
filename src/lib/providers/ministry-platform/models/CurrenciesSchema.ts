import { z } from 'zod';

export const CurrenciesSchema = z.object({
  Currency_ID: z.number().int(),
  Currency_Name: z.string().max(50),
  Currency_Abbrev: z.string().max(10),
  Allow_Online: z.boolean(),
});

export type CurrenciesInput = z.infer<typeof CurrenciesSchema>;
