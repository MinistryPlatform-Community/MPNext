import { z } from 'zod';

export const TimeOffTypesSchema = z.object({
  Time_Off_Type_ID: z.number().int(),
  Time_Off_Type: z.string().max(50),
  Description: z.string().max(500).nullable(),
});

export type TimeOffTypesInput = z.infer<typeof TimeOffTypesSchema>;
