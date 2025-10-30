import { z } from 'zod';

export const HouseholdIdentifierLogSchema = z.object({
  Household_Identifier_ID: z.number().int(),
  Household_ID: z.number().int(),
  Source_System_Name: z.string().max(50),
  Source_Type_Name: z.string().max(128),
  Identifier_Value: z.string().max(4000),
  _Date_Inserted: z.string().datetime(),
});

export type HouseholdIdentifierLogInput = z.infer<typeof HouseholdIdentifierLogSchema>;
