/**
 * Interface for Prayer_Request_Languages
* Table: Prayer_Request_Languages
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PrayerRequestLanguages {

  Prayer_Request_Language_ID: number /* 32-bit integer */; // Primary Key

  Prayer_Request_ID: number /* 32-bit integer */; // Foreign Key -> Prayer_Requests.Prayer_Request_ID

  /**
   * Max length: 10 characters
   */
  Language: string /* max 10 chars */;

  /**
   * Max length: 768 characters
   */
  Prayer_Request: string /* max 768 chars */;

  Last_Updated: string /* ISO datetime */; // Has Default
}

export type PrayerRequestLanguagesRecord = PrayerRequestLanguages;
