/**
 * Interface for Congregation_Snapshots
* Table: Congregation_Snapshots
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationSnapshots {

  Congregation_Snapshot_ID: number /* 32-bit integer */; // Primary Key

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Snapshot_Date: string /* ISO datetime */;

  Period_Start: string /* ISO date (YYYY-MM-DD) */;

  Period_End: string /* ISO date (YYYY-MM-DD) */;

  Active_Households: number /* 32-bit integer */; // Has Default

  Participating_Households: number /* 32-bit integer */; // Has Default

  Donor_Households: number /* 32-bit integer */; // Has Default

  First_Donation_Households: number /* 32-bit integer */; // Has Default

  Second_Donation_Households: number /* 32-bit integer */; // Has Default

  Lapsed_Donor_Households: number /* 32-bit integer */; // Has Default

  Fiscal_Period_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Fiscal_Periods.Fiscal_Period_ID
}

export type CongregationSnapshotsRecord = CongregationSnapshots;
