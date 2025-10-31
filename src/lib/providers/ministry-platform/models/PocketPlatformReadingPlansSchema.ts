import { z } from 'zod';

export const PocketPlatformReadingPlansSchema = z.object({
  Reading_Plan_ID: z.number().int(),
  Reading_Plan: z.string().max(50),
  Congregation_ID: z.number().int().nullable(),
});

export type PocketPlatformReadingPlansInput = z.infer<typeof PocketPlatformReadingPlansSchema>;
