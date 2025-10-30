import { z } from 'zod';

export const SuffixesSchema = z.object({
  Suffix_ID: z.number().int(),
  Suffix: z.string().max(50),
});

export type SuffixesInput = z.infer<typeof SuffixesSchema>;
