import { z } from 'zod';

export const WeeklySnapshotsSchema = z.object({
  Weekly_Snapshot_ID: z.number().int(),
  Start_Date: z.string().datetime(),
  Congregation_ID: z.number().int(),
  Active_People_7Days: z.number().int(),
  Active_People_1Month: z.number().int(),
  Active_People_3Month: z.number().int(),
  Donors_1Month: z.number().int(),
  Volunteers_1Month: z.number().int(),
  Volunteer_Donors_1Month: z.number().int(),
  Inactive_People_1Month: z.number().int(),
  Inactive_Donors_1Month: z.number().int(),
  Household_Donors_1Month: z.number().int(),
  Household_Volunteers_1Month: z.number().int(),
  Household_Volunteer_Donors_1Month: z.number().int(),
  Active_Households_1Month: z.number().int(),
  New_People_7Days: z.number().int(),
  New_Donors_7Days: z.number().int(),
  New_Households_7Days: z.number().int(),
  Tithe_7Days: z.number().nullable(),
  Tithe_Digital_Recurring: z.number().nullable(),
  Tithe_Digital_NonRecurring: z.number().nullable(),
  Tithe_Checks: z.number().nullable(),
  Tithe_Other_NonDigital: z.number().nullable(),
  Salvations_7Days: z.number().int(),
  Active_SmallGroups_7Days: z.number().int(),
  Active_SmallGroup_Members_7Days: z.number().int(),
  Total_CheckIns: z.number().int().nullable(),
  Unique_CheckIns: z.number().int().nullable(),
});

export type WeeklySnapshotsInput = z.infer<typeof WeeklySnapshotsSchema>;
