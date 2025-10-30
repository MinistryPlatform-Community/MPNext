import { z } from 'zod';

export const MpVwCurrentProgramParticipantsSchema = z.object({
  Participant_ID: z.number().int(),
  Program_ID: z.number().int(),
  Ministry_ID: z.number().int(),
  Program_Roles: z.number().int().nullable(),
  Current_Involvement: z.string().max(11),
  Leader_Roles: z.number().int().nullable(),
  Servant_Roles: z.number().int().nullable(),
  Participant_Roles: z.number().int().nullable(),
});

export type MpVwCurrentProgramParticipantsInput = z.infer<typeof MpVwCurrentProgramParticipantsSchema>;
