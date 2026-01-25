import { z } from 'zod';

export const AudienceFiltersSchema = z.object({
  Filter_ID: z.number().int(),
  Filter_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Criteria: z.string().max(1000),
  Contact_ID_Field: z.string().max(256),
  Table_Name: z.unknown(),
});

export type AudienceFiltersInput = z.infer<typeof AudienceFiltersSchema>;
