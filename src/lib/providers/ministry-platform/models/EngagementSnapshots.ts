/**
 * Interface for Engagement_Snapshots
* Table: Engagement_Snapshots
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EngagementSnapshots {

  Engagement_Snapshot_ID: number /* 32-bit integer */; // Primary Key

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Participant_Type_ID: number /* 32-bit integer */; // Foreign Key -> Participant_Types.Participant_Type_ID

  Participant_Engagement_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Participant_Engagement.Participant_Engagement_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Snapshot_Date: string /* ISO date (YYYY-MM-DD) */;

  Period_Start: string /* ISO date (YYYY-MM-DD) */;

  Period_End: string /* ISO date (YYYY-MM-DD) */;

  Giving: boolean; // Has Default

  Serving: boolean; // Has Default

  Leading: boolean; // Has Default

  Group_Life: boolean; // Has Default

  Attending: boolean; // Has Default

  Attendance?: number /* 32-bit integer */ | null;

  Registrations?: number /* 32-bit integer */ | null;

  Gifts?: number /* 32-bit integer */ | null;

  First_Group: boolean; // Has Default

  Began_Serving: boolean; // Has Default

  Began_Leading: boolean; // Has Default
}

export type EngagementSnapshotsRecord = EngagementSnapshots;
