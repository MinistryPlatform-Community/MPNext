import { z } from 'zod';

export const PrayerEngagementsSchema = z.object({
  Prayer_Engagement_ID: z.number().int(),
  Prayer_Request_ID: z.number().int(),
  Prayer_Engagement_Type_ID: z.number().int(),
  Notes: z.string().max(2147483647).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  User_ID: z.number().int(),
});

export type PrayerEngagementsInput = z.infer<typeof PrayerEngagementsSchema>;
