/**
 * Interface for Prayer_Requests
* Table: Prayer_Requests
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PrayerRequests {

  Prayer_Request_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 512 characters
   */
  Prayer_Request: string /* max 512 chars */;

  /**
   * Max length: 10 characters
   */
  Prayer_Language: string /* max 10 chars */; // Has Default

  Entered_On_Behalf: boolean; // Has Default

  Start_Date: string /* ISO datetime */; // Has Default

  Priority_Until?: string /* ISO datetime */ | null;

  Visibility_Level_ID: number /* 32-bit integer */; // Foreign Key -> Visibility_Levels.Visibility_Level_ID, Has Default

  Prayer_Outcome_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Prayer_Outcomes.Prayer_Outcome_ID

  Outcome_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 512 characters
   */
  Outcome?: string /* max 512 chars */ | null;

  Anonymous: boolean; // Has Default

  Forced_Flag: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Urgency?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Importance?: string /* max 50 chars */ | null;

  Inappropiate: boolean; // Has Default

  /**
   * Max length: 512 characters
   */
  Ai_Suggested_Request?: string /* max 512 chars */ | null;

  /**
   * Max length: 256 characters
   */
  Ai_Reason?: string /* max 256 chars */ | null;
}

export type PrayerRequestsRecord = PrayerRequests;
