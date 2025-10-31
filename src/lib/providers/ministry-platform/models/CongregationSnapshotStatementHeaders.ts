/**
 * Interface for Congregation_Snapshot_Statement_Headers
* Table: Congregation_Snapshot_Statement_Headers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationSnapshotStatementHeaders {

  Congregation_Snapshot_Statement_Header_ID: number /* 32-bit integer */; // Primary Key

  Congregation_Snapshot_ID: number /* 32-bit integer */; // Foreign Key -> Congregation_Snapshots.Congregation_Snapshot_ID

  Statement_Header_ID: number /* 32-bit integer */; // Foreign Key -> Statement_Headers.Statement_Header_ID

  Donation_Count: number /* 32-bit integer */;

  Donation_Total: number /* currency amount */;

  Donors: number /* 32-bit integer */;

  Households: number /* 32-bit integer */;
}

export type CongregationSnapshotStatementHeadersRecord = CongregationSnapshotStatementHeaders;
