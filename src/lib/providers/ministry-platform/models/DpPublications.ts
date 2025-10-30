/**
 * Interface for dp_Publications
* Table: dp_Publications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpPublications {

  Publication_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Moderator?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Available_Online?: boolean | null;

  Online_Sort_Order?: number /* 16-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  MailChimp_List?: string /* max 50 chars */ | null;

  Last_Sync_Date?: string /* ISO datetime */ | null;

  Sync_Nightly: boolean; // Has Default

  /**
   * Max length: 25 characters
   */
  Name: string /* max 25 chars */;

  On_Connection_Card: boolean; // Has Default
}

export type DpPublicationsRecord = DpPublications;
