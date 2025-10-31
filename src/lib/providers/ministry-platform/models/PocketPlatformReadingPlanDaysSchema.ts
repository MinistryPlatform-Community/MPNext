import { z } from 'zod';

export const PocketPlatformReadingPlanDaysSchema = z.object({
  Reading_Plan_Day_ID: z.number().int(),
  Reading_Plan_ID: z.number().int(),
  Reading_Plan_Day: z.string().max(50).nullable(),
  Date: z.string().datetime(),
  Passages: z.string().max(500),
  Congregation_ID: z.number().int().nullable(),
});

export type PocketPlatformReadingPlanDaysInput = z.infer<typeof PocketPlatformReadingPlanDaysSchema>;
