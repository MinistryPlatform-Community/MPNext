import { z } from 'zod';

export const NeedProvidersSchema = z.object({
  Need_Provider_ID: z.number().int(),
  Contact_ID: z.number().int(),
});

export type NeedProvidersInput = z.infer<typeof NeedProvidersSchema>;
