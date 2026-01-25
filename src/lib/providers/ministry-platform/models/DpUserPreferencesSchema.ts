import { z } from 'zod';

export const DpUserPreferencesSchema = z.object({
  User_Preference_ID: z.number().int(),
  User_ID: z.number().int().nullable(),
  Key: z.string().max(64),
  Value: z.string().max(2147483647).nullable(),
  Page_ID: z.number().int().nullable(),
  Sub_Page_ID: z.number().int().nullable(),
  Page_View_ID: z.number().int().nullable(),
  Sub_Page_View_ID: z.number().int().nullable(),
});

export type DpUserPreferencesInput = z.infer<typeof DpUserPreferencesSchema>;
