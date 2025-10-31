import { z } from 'zod';

export const PrayerRequestLanguagesSchema = z.object({
  Prayer_Request_Language_ID: z.number().int(),
  Prayer_Request_ID: z.number().int(),
  Language: z.string().max(10),
  Prayer_Request: z.string().max(768),
  Last_Updated: z.string().datetime(),
});

export type PrayerRequestLanguagesInput = z.infer<typeof PrayerRequestLanguagesSchema>;
