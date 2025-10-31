import { z } from 'zod';

export const PrayerOutcomesSchema = z.object({
  Prayer_Outcome_ID: z.number().int(),
  Prayer_Outcome: z.string().max(50),
});

export type PrayerOutcomesInput = z.infer<typeof PrayerOutcomesSchema>;
