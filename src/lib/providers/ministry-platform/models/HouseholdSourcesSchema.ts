import { z } from 'zod';

export const HouseholdSourcesSchema = z.object({
  Household_Source_ID: z.number().int(),
  Household_Source: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type HouseholdSourcesInput = z.infer<typeof HouseholdSourcesSchema>;
