/**
 * Interface for Ministry_Updates
* Table: Ministry_Updates
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface MinistryUpdates {

  Ministry_Update_ID: number /* 32-bit integer */; // Primary Key

  Submitted_By: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 50 characters
   */
  Update_Title: string /* max 50 chars */;

  Ministry_ID: number /* 32-bit integer */; // Foreign Key -> Ministries.Ministry_ID

  Date: string /* ISO datetime */;

  Budget_Proposal: boolean; // Has Default

  /**
   * Max length: 5000 characters
   */
  Description?: string /* max 5000 chars */ | null;
}

export type MinistryUpdatesRecord = MinistryUpdates;
