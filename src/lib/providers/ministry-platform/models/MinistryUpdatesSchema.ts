import { z } from 'zod';

export const MinistryUpdatesSchema = z.object({
  Ministry_Update_ID: z.number().int(),
  Submitted_By: z.number().int(),
  Update_Title: z.string().max(50),
  Ministry_ID: z.number().int(),
  Date: z.string().datetime(),
  Budget_Proposal: z.boolean(),
  Description: z.string().max(5000).nullable(),
});

export type MinistryUpdatesInput = z.infer<typeof MinistryUpdatesSchema>;
