import { z } from 'zod';

export const CongregationSnapshotMilestonesSchema = z.object({
  Congregation_Snapshot_Milestone_ID: z.number().int(),
  Congregation_Snapshot_ID: z.number().int(),
  Milestone_ID: z.number().int(),
  Assigned_Participants: z.number().int(),
  Assigned_Heads: z.number().int(),
  Assigned_Minor_Child: z.number().int(),
  Assigned_Adult_Child: z.number().int(),
  Assigned_Other_Adult: z.number().int(),
  Assigned_Guest_Child: z.number().int(),
  Assigned_Other: z.number().int(),
});

export type CongregationSnapshotMilestonesInput = z.infer<typeof CongregationSnapshotMilestonesSchema>;
