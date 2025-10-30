import { z } from 'zod';

export const CareCasesSchema = z.object({
  Care_Case_ID: z.number().int(),
  Title: z.string().max(128).nullable(),
  Description: z.string().max(512).nullable(),
  Household_ID: z.number().int(),
  Contact_ID: z.number().int().nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Care_Case_Type_ID: z.number().int(),
  Location_ID: z.number().int().nullable(),
  Case_Manager: z.number().int().nullable(),
  Share_With_Group_Leaders: z.boolean(),
  Program_ID: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
});

export type CareCasesInput = z.infer<typeof CareCasesSchema>;
