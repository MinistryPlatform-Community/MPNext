import { z } from 'zod';

export const CongregationAuditsSchema = z.object({
  Congregation_Audit_ID: z.number().int(),
  Household_ID: z.number().int(),
  Change_Date: z.string().datetime(),
  Prior_Congregation: z.number().int(),
  New_Congregation: z.number().int(),
  Notes: z.string().max(300).nullable(),
});

export type CongregationAuditsInput = z.infer<typeof CongregationAuditsSchema>;
