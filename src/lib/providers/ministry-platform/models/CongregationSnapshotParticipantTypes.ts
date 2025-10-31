/**
 * Interface for Congregation_Snapshot_Participant_Types
* Table: Congregation_Snapshot_Participant_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationSnapshotParticipantTypes {

  Congregation_Snapshot_Participant_Type_ID: number /* 32-bit integer */; // Primary Key

  Congregation_Snapshot_ID: number /* 32-bit integer */; // Foreign Key -> Congregation_Snapshots.Congregation_Snapshot_ID

  Participant_Type_ID: number /* 32-bit integer */; // Foreign Key -> Participant_Types.Participant_Type_ID

  Total_Participants: number /* 32-bit integer */; // Has Default

  Head_of_Household: number /* 32-bit integer */; // Has Default

  Minor_Child: number /* 32-bit integer */; // Has Default

  Adult_Child: number /* 32-bit integer */; // Has Default

  Other_Adult: number /* 32-bit integer */; // Has Default

  Guest_Child: number /* 32-bit integer */; // Has Default

  Company_or_Other: number /* 32-bit integer */; // Has Default
}

export type CongregationSnapshotParticipantTypesRecord = CongregationSnapshotParticipantTypes;
