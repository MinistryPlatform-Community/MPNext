/**
 * Interface for Congregation_Snapshot_Group_Types
* Table: Congregation_Snapshot_Group_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationSnapshotGroupTypes {

  Congregation_Snapshot_Group_Type_ID: number /* 32-bit integer */; // Primary Key

  Congregation_Snapshot_ID: number /* 32-bit integer */; // Foreign Key -> Congregation_Snapshots.Congregation_Snapshot_ID

  Group_Type_ID: number /* 32-bit integer */; // Foreign Key -> Group_Types.Group_Type_ID

  Groups: number /* 32-bit integer */; // Has Default

  Participants: number /* 32-bit integer */; // Has Default

  Servants: number /* 32-bit integer */; // Has Default

  Leaders: number /* 32-bit integer */; // Has Default

  Other: number /* 32-bit integer */; // Has Default

  Total_Participants: number /* 32-bit integer */; // Has Default

  Distinct_Participants: number /* 32-bit integer */; // Has Default

  Distinct_Servants: number /* 32-bit integer */; // Has Default

  Distinct_Leaders: number /* 32-bit integer */; // Has Default

  Distinct_Other: number /* 32-bit integer */; // Has Default

  Distinct_Total_Participants: number /* 32-bit integer */; // Has Default

  New_Groups: number /* 32-bit integer */; // Has Default

  Ended_Groups: number /* 32-bit integer */; // Has Default

  New_Participants: number /* 32-bit integer */; // Has Default

  Ended_Participants: number /* 32-bit integer */; // Has Default
}

export type CongregationSnapshotGroupTypesRecord = CongregationSnapshotGroupTypes;
