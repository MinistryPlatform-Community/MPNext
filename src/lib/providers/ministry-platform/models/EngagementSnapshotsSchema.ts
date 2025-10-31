import { z } from 'zod';

export const EngagementSnapshotsSchema = z.object({
  Engagement_Snapshot_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Participant_Type_ID: z.number().int(),
  Participant_Engagement_ID: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Snapshot_Date: z.string().datetime(),
  Period_Start: z.string().datetime(),
  Period_End: z.string().datetime(),
  Giving: z.boolean(),
  Serving: z.boolean(),
  Leading: z.boolean(),
  Group_Life: z.boolean(),
  Attending: z.boolean(),
  Attendance: z.number().int().nullable(),
  Registrations: z.number().int().nullable(),
  Gifts: z.number().int().nullable(),
  First_Group: z.boolean(),
  Began_Serving: z.boolean(),
  Began_Leading: z.boolean(),
});

export type EngagementSnapshotsInput = z.infer<typeof EngagementSnapshotsSchema>;
