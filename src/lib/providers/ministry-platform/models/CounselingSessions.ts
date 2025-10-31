/**
 * Interface for Counseling_Sessions
* Table: Counseling_Sessions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface CounselingSessions {

  Counseling_Session_ID: number /* 32-bit integer */; // Primary Key

  Counseling_Engagement_ID: number /* 32-bit integer */; // Foreign Key -> Counseling_Engagements.Counseling_Engagement_ID

  Session_Date: string /* ISO datetime */;

  /**
   * Max length: 2147483647 characters
   */
  Notes?: string /* max 2147483647 chars */ | null;
}

export type CounselingSessionsRecord = CounselingSessions;
