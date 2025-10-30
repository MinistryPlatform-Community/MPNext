import { z } from 'zod';

export const FrequenciesSchema = z.object({
  Frequency_ID: z.number().int(),
  Frequency: z.string().max(128),
});

export type FrequenciesInput = z.infer<typeof FrequenciesSchema>;
