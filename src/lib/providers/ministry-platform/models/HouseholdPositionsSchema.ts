import { z } from 'zod';

export const HouseholdPositionsSchema = z.object({
  Household_Position_ID: z.number().int(),
  Household_Position: z.string().max(25),
  Description: z.string().max(255).nullable(),
});

export type HouseholdPositionsInput = z.infer<typeof HouseholdPositionsSchema>;
