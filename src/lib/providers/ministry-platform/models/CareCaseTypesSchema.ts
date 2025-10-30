import { z } from 'zod';

export const CareCaseTypesSchema = z.object({
  Care_Case_Type_ID: z.number().int(),
  Care_Case_Type: z.string().max(128),
  Description: z.string().max(512).nullable(),
});

export type CareCaseTypesInput = z.infer<typeof CareCaseTypesSchema>;
