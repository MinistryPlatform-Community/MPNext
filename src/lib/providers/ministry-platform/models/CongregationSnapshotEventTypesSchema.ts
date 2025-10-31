import { z } from 'zod';

export const CongregationSnapshotEventTypesSchema = z.object({
  Congregation_Snapshot_Event_Type_ID: z.number().int(),
  Congregation_Snapshot_ID: z.number().int(),
  Event_Type_ID: z.number().int(),
  Events: z.number().int(),
  Distinct_Participants_Any_Status: z.number().int(),
  Participants_Any_Status: z.number().int(),
  Interested: z.number().int(),
  Registered: z.number().int(),
  Attended: z.number().int(),
  Confirmed: z.number().int(),
  Cancelled: z.number().int(),
  Present_Distinct_Participants: z.number().int(),
  Present_Participants: z.number().int(),
  Present_Adults: z.number().int(),
  Present_Children: z.number().int(),
  Present_Others: z.number().int(),
  Present_Distinct_Adults: z.number().int(),
  Present_Distinct_Children: z.number().int(),
  Present_Distinct_Others: z.number().int(),
});

export type CongregationSnapshotEventTypesInput = z.infer<typeof CongregationSnapshotEventTypesSchema>;
