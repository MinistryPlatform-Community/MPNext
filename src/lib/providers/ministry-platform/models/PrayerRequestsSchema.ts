import { z } from 'zod';

export const PrayerRequestsSchema = z.object({
  Prayer_Request_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Congregation_ID: z.number().int(),
  Prayer_Request: z.string().max(512),
  Prayer_Language: z.string().max(10),
  Entered_On_Behalf: z.boolean(),
  Start_Date: z.string().datetime(),
  Priority_Until: z.string().datetime().nullable(),
  Visibility_Level_ID: z.number().int(),
  Prayer_Outcome_ID: z.number().int().nullable(),
  Outcome_Date: z.string().datetime().nullable(),
  Outcome: z.string().max(512).nullable(),
  Anonymous: z.boolean(),
  Forced_Flag: z.boolean(),
  Urgency: z.string().max(50).nullable(),
  Importance: z.string().max(50).nullable(),
  Inappropiate: z.boolean(),
  Ai_Suggested_Request: z.string().max(512).nullable(),
  Ai_Reason: z.string().max(256).nullable(),
});

export type PrayerRequestsInput = z.infer<typeof PrayerRequestsSchema>;
