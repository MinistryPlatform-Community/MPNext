import { z } from 'zod';

export const SponsorTypesSchema = z.object({
  Sponsor_Type_ID: z.number().int(),
  Sponsor_Type: z.string().max(25),
  Description: z.string().max(255).nullable(),
});

export type SponsorTypesInput = z.infer<typeof SponsorTypesSchema>;
