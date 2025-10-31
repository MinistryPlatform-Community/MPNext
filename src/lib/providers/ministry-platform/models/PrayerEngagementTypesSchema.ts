import { z } from 'zod';

export const PrayerEngagementTypesSchema = z.object({
  Prayer_Engagement_Type_ID: z.number().int(),
  Prayer_Engagement_Type: z.string().max(50),
});

export type PrayerEngagementTypesInput = z.infer<typeof PrayerEngagementTypesSchema>;
