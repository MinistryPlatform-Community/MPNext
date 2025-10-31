/**
 * Interface for Audiences
* Table: Audiences
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Audiences {

  Audience_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Audience_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Processing_Order: number /* 32-bit integer */; // Has Default

  Active: boolean; // Has Default

  Last_Update_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 256 characters
   */
  Last_Update_Status?: string /* max 256 chars */ | null;

  Next_Update_Date?: string /* ISO datetime */ | null;

  Add_to_Publication?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Publications.Publication_ID

  Remove_From_Publication: boolean; // Has Default
}

export type AudiencesRecord = Audiences;
