/**
 * Interface for Weekly_Snapshots
* Table: Weekly_Snapshots
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface WeeklySnapshots {

  Weekly_Snapshot_ID: number /* 32-bit integer */; // Primary Key

  Start_Date: string /* ISO datetime */;

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Active_People_7Days: number /* 32-bit integer */;

  Active_People_1Month: number /* 32-bit integer */;

  Active_People_3Month: number /* 32-bit integer */; // Has Default

  Donors_1Month: number /* 32-bit integer */;

  Volunteers_1Month: number /* 32-bit integer */;

  Volunteer_Donors_1Month: number /* 32-bit integer */;

  Inactive_People_1Month: number /* 32-bit integer */;

  Inactive_Donors_1Month: number /* 32-bit integer */;

  Household_Donors_1Month: number /* 32-bit integer */;

  Household_Volunteers_1Month: number /* 32-bit integer */;

  Household_Volunteer_Donors_1Month: number /* 32-bit integer */;

  Active_Households_1Month: number /* 32-bit integer */;

  New_People_7Days: number /* 32-bit integer */;

  New_Donors_7Days: number /* 32-bit integer */;

  New_Households_7Days: number /* 32-bit integer */;

  Tithe_7Days?: number /* decimal */ | null;

  Tithe_Digital_Recurring?: number /* decimal */ | null;

  Tithe_Digital_NonRecurring?: number /* decimal */ | null;

  Tithe_Checks?: number /* decimal */ | null;

  Tithe_Other_NonDigital?: number /* decimal */ | null;

  Salvations_7Days: number /* 32-bit integer */; // Has Default

  Active_SmallGroups_7Days: number /* 32-bit integer */; // Has Default

  Active_SmallGroup_Members_7Days: number /* 32-bit integer */; // Has Default

  Total_CheckIns?: number /* 32-bit integer */ | null;

  Unique_CheckIns?: number /* 32-bit integer */ | null;
}

export type WeeklySnapshotsRecord = WeeklySnapshots;
