/**
 * Interface for Counseling_Types
* Table: Counseling_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CounselingTypes {

  Counseling_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Counseling_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Notes?: string /* max 255 chars */ | null;
}

export type CounselingTypesRecord = CounselingTypes;
