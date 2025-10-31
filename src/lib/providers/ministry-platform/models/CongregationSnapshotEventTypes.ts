/**
 * Interface for Congregation_Snapshot_Event_Types
* Table: Congregation_Snapshot_Event_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationSnapshotEventTypes {

  Congregation_Snapshot_Event_Type_ID: number /* 32-bit integer */; // Primary Key

  Congregation_Snapshot_ID: number /* 32-bit integer */; // Foreign Key -> Congregation_Snapshots.Congregation_Snapshot_ID

  Event_Type_ID: number /* 32-bit integer */; // Foreign Key -> Event_Types.Event_Type_ID

  Events: number /* 32-bit integer */; // Has Default

  Distinct_Participants_Any_Status: number /* 32-bit integer */; // Has Default

  Participants_Any_Status: number /* 32-bit integer */; // Has Default

  Interested: number /* 32-bit integer */; // Has Default

  Registered: number /* 32-bit integer */; // Has Default

  Attended: number /* 32-bit integer */; // Has Default

  Confirmed: number /* 32-bit integer */; // Has Default

  Cancelled: number /* 32-bit integer */; // Has Default

  Present_Distinct_Participants: number /* 32-bit integer */; // Has Default

  Present_Participants: number /* 32-bit integer */; // Has Default

  Present_Adults: number /* 32-bit integer */; // Has Default

  Present_Children: number /* 32-bit integer */; // Has Default

  Present_Others: number /* 32-bit integer */; // Has Default

  Present_Distinct_Adults: number /* 32-bit integer */; // Has Default

  Present_Distinct_Children: number /* 32-bit integer */; // Has Default

  Present_Distinct_Others: number /* 32-bit integer */; // Has Default
}

export type CongregationSnapshotEventTypesRecord = CongregationSnapshotEventTypes;
