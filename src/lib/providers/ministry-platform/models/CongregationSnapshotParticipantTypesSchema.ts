import { z } from 'zod';

export const CongregationSnapshotParticipantTypesSchema = z.object({
  Congregation_Snapshot_Participant_Type_ID: z.number().int(),
  Congregation_Snapshot_ID: z.number().int(),
  Participant_Type_ID: z.number().int(),
  Total_Participants: z.number().int(),
  Head_of_Household: z.number().int(),
  Minor_Child: z.number().int(),
  Adult_Child: z.number().int(),
  Other_Adult: z.number().int(),
  Guest_Child: z.number().int(),
  Company_or_Other: z.number().int(),
});

export type CongregationSnapshotParticipantTypesInput = z.infer<typeof CongregationSnapshotParticipantTypesSchema>;
