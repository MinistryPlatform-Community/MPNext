import { z } from 'zod';

export const CongregationSnapshotGroupTypesSchema = z.object({
  Congregation_Snapshot_Group_Type_ID: z.number().int(),
  Congregation_Snapshot_ID: z.number().int(),
  Group_Type_ID: z.number().int(),
  Groups: z.number().int(),
  Participants: z.number().int(),
  Servants: z.number().int(),
  Leaders: z.number().int(),
  Other: z.number().int(),
  Total_Participants: z.number().int(),
  Distinct_Participants: z.number().int(),
  Distinct_Servants: z.number().int(),
  Distinct_Leaders: z.number().int(),
  Distinct_Other: z.number().int(),
  Distinct_Total_Participants: z.number().int(),
  New_Groups: z.number().int(),
  Ended_Groups: z.number().int(),
  New_Participants: z.number().int(),
  Ended_Participants: z.number().int(),
});

export type CongregationSnapshotGroupTypesInput = z.infer<typeof CongregationSnapshotGroupTypesSchema>;
