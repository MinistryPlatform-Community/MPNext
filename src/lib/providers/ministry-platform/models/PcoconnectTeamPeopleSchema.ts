import { z } from 'zod';

export const PcoconnectTeamPeopleSchema = z.object({
  PCOConnect_Team_Person_ID: z.number().int(),
  PCOConnect_Person_ID: z.number().int().nullable(),
  PCOConnect_Team_ID: z.number().int().nullable(),
  Person_ID: z.number().int().nullable(),
  Team_ID: z.number().int().nullable(),
  Status: z.string().max(50).nullable(),
  Group_Participant_ID: z.number().int().nullable(),
  Date_Created: z.string().datetime().nullable(),
  Date_Updated: z.string().datetime().nullable(),
  Date_Refreshed: z.string().datetime().nullable(),
  Date_Archived: z.string().datetime().nullable(),
  Org_Num: z.number().int().nullable(),
  Do_Not_Update_GP: z.boolean().nullable(),
});

export type PcoconnectTeamPeopleInput = z.infer<typeof PcoconnectTeamPeopleSchema>;
