import { z } from 'zod';

export const LocationTypesSchema = z.object({
  Location_Type_ID: z.number().int(),
  Location_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type LocationTypesInput = z.infer<typeof LocationTypesSchema>;
