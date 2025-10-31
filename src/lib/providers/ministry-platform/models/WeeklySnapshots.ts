/**
 * Interface for Weekly_Snapshots
* Table: Weekly_Snapshots
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface WeeklySnapshots {

  Weekly_Snapshot_ID: number /* 32-bit integer */; // Primary Key

  Start_Date: string /* ISO datetime */;

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  All_People: number /* 32-bit integer */;

  Active_People_7Days: number /* 32-bit integer */;

  Active_People_1Month: number /* 32-bit integer */;

  Active_People_3Month: number /* 32-bit integer */; // Has Default

  Donors_1Month: number /* 32-bit integer */;

  Engaged_People?: number /* 32-bit integer */ | null;

  Effective_Donors_1Month: number /* 32-bit integer */; // Has Default

  Volunteers_1Month?: number /* 32-bit integer */ | null;

  Volunteer_Donors_1Month?: number /* 32-bit integer */ | null;

  New_People_7Days: number /* 32-bit integer */;

  Inactive_People_7Days: number /* 32-bit integer */;

  Inactive_People_1Month: number /* 32-bit integer */;

  New_Donors_7Days: number /* 32-bit integer */;

  New_Volunteers_7Days?: number /* 32-bit integer */ | null;

  Inactive_Donors_1Month: number /* 32-bit integer */;

  All_Adults: number /* 32-bit integer */;

  Active_Adults_7Days: number /* 32-bit integer */;

  Active_Adults_1Month: number /* 32-bit integer */;

  Active_Adults_3Month: number /* 32-bit integer */; // Has Default

  Adult_Donors_1Month: number /* 32-bit integer */;

  Adult_Volunteers_1Month?: number /* 32-bit integer */ | null;

  Active_Placed_Volunteer_Snap?: number /* 32-bit integer */ | null;

  Adult_Volunteer_Donors_1Month?: number /* 32-bit integer */ | null;

  New_Adults_7Days: number /* 32-bit integer */;

  Inactive_Adults_7Days: number /* 32-bit integer */;

  Inactive_Adults_1Month: number /* 32-bit integer */;

  New_Adult_Donors_7Days: number /* 32-bit integer */;

  New_Adult_Volunteers_7Days?: number /* 32-bit integer */ | null;

  Inactive_Adult_Donors_1Month: number /* 32-bit integer */;

  All_Households: number /* 32-bit integer */;

  Active_Households_7Days: number /* 32-bit integer */;

  Active_Households_1Month: number /* 32-bit integer */;

  Active_Households_3Month: number /* 32-bit integer */; // Has Default

  Household_Donors_1Month: number /* 32-bit integer */;

  Household_Volunteers_1Month?: number /* 32-bit integer */ | null;

  Household_Volunteer_Donors_1Month?: number /* 32-bit integer */ | null;

  New_Households_7Days: number /* 32-bit integer */;

  Inactive_Households_7Days: number /* 32-bit integer */;

  Inactive_Households_1Month: number /* 32-bit integer */;

  New_Donor_Households_7Days: number /* 32-bit integer */;

  New_Volunteer_Households_7Days?: number /* 32-bit integer */ | null;

  Inactive_Donor_Households_1Month: number /* 32-bit integer */;

  Tithe_7Days?: number /* decimal */ | null;

  Tithe_Digital_Recurring?: number /* decimal */ | null;

  Tithe_Digital_NonRecurring?: number /* decimal */ | null;

  Tithe_Checks?: number /* decimal */ | null;

  Tithe_Other_NonDigital?: number /* decimal */ | null;

  Salvations: number /* 32-bit integer */; // Has Default

  Baptisms: number /* 32-bit integer */; // Has Default

  Active_SmallGroups_7Days: number /* 32-bit integer */; // Has Default

  Active_SmallGroup_Members_7Days: number /* 32-bit integer */; // Has Default

  Total_CheckIns?: number /* 32-bit integer */ | null;

  Unique_CheckIns?: number /* 32-bit integer */ | null;

  App_Installs?: number /* 32-bit integer */ | null;

  App_Activity?: number /* 32-bit integer */ | null;
}

export type WeeklySnapshotsRecord = WeeklySnapshots;
