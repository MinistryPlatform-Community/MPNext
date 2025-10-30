import { z } from 'zod';

export const AudienceMembersSchema = z.object({
  Audience_Member_ID: z.number().int(),
  Audience_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Forced_Filter: z.boolean(),
  Active: z.boolean(),
  Last_Update_Date: z.string().datetime(),
});

export type AudienceMembersInput = z.infer<typeof AudienceMembersSchema>;
