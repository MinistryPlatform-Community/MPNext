import { z } from 'zod';

export const PledgeFrequenciesSchema = z.object({
  Pledge_Frequency_ID: z.number().int(),
  Pledge_Frequency: z.string().max(128),
});

export type PledgeFrequenciesInput = z.infer<typeof PledgeFrequenciesSchema>;
