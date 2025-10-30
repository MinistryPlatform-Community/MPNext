import { z } from 'zod';

export const GendersSchema = z.object({
  Gender_ID: z.number().int(),
  Gender: z.string().max(25),
});

export type GendersInput = z.infer<typeof GendersSchema>;
