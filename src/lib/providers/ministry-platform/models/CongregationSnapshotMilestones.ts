/**
 * Interface for Congregation_Snapshot_Milestones
* Table: Congregation_Snapshot_Milestones
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationSnapshotMilestones {

  Congregation_Snapshot_Milestone_ID: number /* 32-bit integer */; // Primary Key

  Congregation_Snapshot_ID: number /* 32-bit integer */; // Foreign Key -> Congregation_Snapshots.Congregation_Snapshot_ID

  Milestone_ID: number /* 32-bit integer */; // Foreign Key -> Milestones.Milestone_ID

  Assigned_Participants: number /* 32-bit integer */; // Has Default

  Assigned_Heads: number /* 32-bit integer */; // Has Default

  Assigned_Minor_Child: number /* 32-bit integer */; // Has Default

  Assigned_Adult_Child: number /* 32-bit integer */; // Has Default

  Assigned_Other_Adult: number /* 32-bit integer */; // Has Default

  Assigned_Guest_Child: number /* 32-bit integer */; // Has Default

  Assigned_Other: number /* 32-bit integer */; // Has Default
}

export type CongregationSnapshotMilestonesRecord = CongregationSnapshotMilestones;
