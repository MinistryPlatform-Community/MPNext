/**
 * Interface for Faith_Backgrounds
* Table: Faith_Backgrounds
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface FaithBackgrounds {

  Faith_Background_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Faith_Background: string /* max 50 chars */;
}

export type FaithBackgroundsRecord = FaithBackgrounds;
