import { z } from 'zod';

export const MaritalStatusesSchema = z.object({
  Marital_Status_ID: z.number().int(),
  Marital_Status: z.string().max(25),
});

export type MaritalStatusesInput = z.infer<typeof MaritalStatusesSchema>;
