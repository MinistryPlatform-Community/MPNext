/**
 * Interface for dp_User_Preferences
* Table: dp_User_Preferences
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpUserPreferences {

  User_Preference_ID: number /* 32-bit integer */; // Primary Key

  User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 64 characters
   */
  Key: string /* max 64 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Value?: string /* max 2147483647 chars */ | null;

  Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID

  Sub_Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Sub_Pages.Sub_Page_ID

  Page_View_ID?: number /* 32-bit integer */ | null;

  Sub_Page_View_ID?: number /* 32-bit integer */ | null;
}

export type DpUserPreferencesRecord = DpUserPreferences;
