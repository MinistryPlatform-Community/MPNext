/**
 * Interface for Counseling_Engagements
* Table: Counseling_Engagements
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CounselingEngagements {

  Counseling_Engagement_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Counselor?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Counseling_Type_ID: number /* 32-bit integer */; // Foreign Key -> Counseling_Types.Counseling_Type_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;
}

export type CounselingEngagementsRecord = CounselingEngagements;
