/**
 * Interface for Group_Activities
* Table: Group_Activities
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupActivities {

  Group_Activity_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Group_Activity: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type GroupActivitiesRecord = GroupActivities;
