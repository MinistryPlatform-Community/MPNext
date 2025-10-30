/**
 * Interface for Letters
* Table: Letters
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Letters {

  Letter_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Letter_Title: string /* max 50 chars */;

  Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID

  /**
   * Max length: 2147483647 characters
   */
  Letter_Opening?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Letter_Body?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Letter_From?: string /* max 2147483647 chars */ | null;

  Active: boolean; // Has Default

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type LettersRecord = Letters;
