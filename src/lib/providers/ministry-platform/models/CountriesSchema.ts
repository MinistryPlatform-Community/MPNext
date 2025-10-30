import { z } from 'zod';

export const CountriesSchema = z.object({
  Country_ID: z.number().int(),
  Country: z.string().max(255).nullable(),
  Continent_ID: z.number().int().nullable(),
  Country_Code: z.string().max(2).nullable(),
  Code2: z.string().max(2).nullable(),
  Code3: z.string().max(3).nullable(),
  Calling_Code: z.string().max(32).nullable(),
});

export type CountriesInput = z.infer<typeof CountriesSchema>;
