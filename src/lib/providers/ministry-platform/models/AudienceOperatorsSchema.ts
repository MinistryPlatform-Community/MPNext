import { z } from 'zod';

export const AudienceOperatorsSchema = z.object({
  Operator_ID: z.number().int(),
  Operator: z.string().max(50),
});

export type AudienceOperatorsInput = z.infer<typeof AudienceOperatorsSchema>;
