import { z } from 'zod';

export const PledgeStatusesSchema = z.object({
  Pledge_Status_ID: z.number().int(),
  Pledge_Status: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type PledgeStatusesInput = z.infer<typeof PledgeStatusesSchema>;
