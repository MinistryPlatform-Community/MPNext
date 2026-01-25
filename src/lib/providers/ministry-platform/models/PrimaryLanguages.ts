/**
 * Interface for Primary_Languages
* Table: Primary_Languages
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PrimaryLanguages {

  Primary_Language_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Primary_Language: string /* max 50 chars */;
}

export type PrimaryLanguagesRecord = PrimaryLanguages;
