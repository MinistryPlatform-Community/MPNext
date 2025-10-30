import { z } from 'zod';

export const PrefixesSchema = z.object({
  Prefix_ID: z.number().int(),
  Prefix: z.string().max(50),
});

export type PrefixesInput = z.infer<typeof PrefixesSchema>;
