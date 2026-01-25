import { z } from 'zod';

export const ContributionStatementDonorsSchema = z.object({
  Statement_Donor_ID: z.number().int(),
  Statement_ID: z.number().int(),
  Donor_ID: z.number().int(),
});

export type ContributionStatementDonorsInput = z.infer<typeof ContributionStatementDonorsSchema>;
