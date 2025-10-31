import { z } from 'zod';

export const PcoconnectTeamsSchema = z.object({
  PCOConnect_Team_ID: z.number().int(),
  Team_ID: z.number().int().nullable(),
  Team_Name: z.string().max(150).nullable(),
  PCOConnect_Service_Type_ID: z.number().int().nullable(),
  Group_ID: z.number().int().nullable(),
  Status: z.string().max(50).nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Date_Archived: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
});

export type PcoconnectTeamsInput = z.infer<typeof PcoconnectTeamsSchema>;
