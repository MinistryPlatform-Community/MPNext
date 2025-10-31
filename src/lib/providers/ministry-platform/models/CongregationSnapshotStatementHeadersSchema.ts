import { z } from 'zod';

export const CongregationSnapshotStatementHeadersSchema = z.object({
  Congregation_Snapshot_Statement_Header_ID: z.number().int(),
  Congregation_Snapshot_ID: z.number().int(),
  Statement_Header_ID: z.number().int(),
  Donation_Count: z.number().int(),
  Donation_Total: z.number(),
  Donors: z.number().int(),
  Households: z.number().int(),
});

export type CongregationSnapshotStatementHeadersInput = z.infer<typeof CongregationSnapshotStatementHeadersSchema>;
