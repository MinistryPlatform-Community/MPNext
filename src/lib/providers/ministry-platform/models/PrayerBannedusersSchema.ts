import { z } from 'zod';

export const PrayerBannedusersSchema = z.object({
  Prayer_BannedUser_ID: z.number().int(),
  User_ID: z.number().int(),
  Start_Date: z.string().datetime(),
});

export type PrayerBannedusersInput = z.infer<typeof PrayerBannedusersSchema>;
