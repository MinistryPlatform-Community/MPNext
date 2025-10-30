/**
 * Interface for Citizenship_Types
* Table: Citizenship_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CitizenshipTypes {

  Citizenship_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Citizenship_Type: string /* max 50 chars */;
}

export type CitizenshipTypesRecord = CitizenshipTypes;
