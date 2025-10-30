import { z } from 'zod';

export const LocationGroupTypesSchema = z.object({
  Location_Group_Type_ID: z.number().int(),
  Location_Group_Type: z.string().max(50).nullable(),
});

export type LocationGroupTypesInput = z.infer<typeof LocationGroupTypesSchema>;
