import { z } from 'zod';

export const ScheduledParticipantsSchema = z.object({
  Schedule_Participant_ID: z.number().int(),
  Schedule_Role_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Accepted: z.boolean().nullable(),
  Notes: z.string().max(2000).nullable(),
  Declined_and_Hidden: z.boolean(),
  _Scheduled_Participant_GUID: z.string().uuid(),
});

export type ScheduledParticipantsInput = z.infer<typeof ScheduledParticipantsSchema>;
