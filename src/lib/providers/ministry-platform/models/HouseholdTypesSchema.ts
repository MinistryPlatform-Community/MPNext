import { z } from 'zod';

export const HouseholdTypesSchema = z.object({
  Household_Type_ID: z.number().int(),
  Household_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type HouseholdTypesInput = z.infer<typeof HouseholdTypesSchema>;
