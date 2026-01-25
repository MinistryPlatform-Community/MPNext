import { z } from 'zod';

export const LocationGroupsSchema = z.object({
  Location_Group_ID: z.number().int(),
  Location_Group: z.string().max(50).nullable(),
  Location_Group_Type_ID: z.number().int(),
  Parent_Location_Group: z.number().int().nullable(),
});

export type LocationGroupsInput = z.infer<typeof LocationGroupsSchema>;
