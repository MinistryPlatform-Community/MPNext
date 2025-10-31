import { z } from 'zod';

export const AudiencesSchema = z.object({
  Audience_ID: z.number().int(),
  Audience_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Processing_Order: z.number().int(),
  Active: z.boolean(),
  Last_Update_Date: z.string().datetime().nullable(),
  Last_Update_Status: z.string().max(256).nullable(),
  Next_Update_Date: z.string().datetime().nullable(),
  Add_to_Publication: z.number().int().nullable(),
  Remove_From_Publication: z.boolean(),
});

export type AudiencesInput = z.infer<typeof AudiencesSchema>;
