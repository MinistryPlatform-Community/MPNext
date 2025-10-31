import { z } from 'zod';

export const CongregationSnapshotsSchema = z.object({
  Congregation_Snapshot_ID: z.number().int(),
  Congregation_ID: z.number().int().nullable(),
  Snapshot_Date: z.string().datetime(),
  Period_Start: z.string().datetime(),
  Period_End: z.string().datetime(),
  Active_Households: z.number().int(),
  Participating_Households: z.number().int(),
  Donor_Households: z.number().int(),
  First_Donation_Households: z.number().int(),
  Second_Donation_Households: z.number().int(),
  Lapsed_Donor_Households: z.number().int(),
  Fiscal_Period_ID: z.number().int().nullable(),
});

export type CongregationSnapshotsInput = z.infer<typeof CongregationSnapshotsSchema>;
