/**
 * Interface for Activity_Log
* Table: Activity_Log
 * Access Level: ReadWrite
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface ActivityLog {

  Activity_Log_ID: number /* 32-bit integer */; // Primary Key

  Activity_Date: string /* ISO datetime */;

  /**
   * Max length: 75 characters
   */
  Activity_Type: string /* max 75 chars */;

  /**
   * Max length: 75 characters
   */
  Record_Name: string /* max 75 chars */;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Household_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Households.Household_ID

  Page_ID: number /* 32-bit integer */; // Foreign Key -> dp_Pages.Page_ID

  Record_ID: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Table_Name: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Page_Name: string /* max 50 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Ministry_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Ministries.Ministry_ID
}

export type ActivityLogRecord = ActivityLog;
