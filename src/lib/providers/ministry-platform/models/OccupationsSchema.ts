import { z } from 'zod';

export const OccupationsSchema = z.object({
  Occupation_ID: z.number().int(),
  Occupation_Title: z.string().max(255),
});

export type OccupationsInput = z.infer<typeof OccupationsSchema>;
