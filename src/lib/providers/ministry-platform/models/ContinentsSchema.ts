import { z } from 'zod';

export const ContinentsSchema = z.object({
  Continent_ID: z.number().int(),
  Continent: z.string().max(25),
});

export type ContinentsInput = z.infer<typeof ContinentsSchema>;
