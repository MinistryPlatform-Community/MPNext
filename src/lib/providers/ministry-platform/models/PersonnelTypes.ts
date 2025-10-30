/**
 * Interface for Personnel_Types
* Table: Personnel_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelTypes {

  Personnel_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Personnel_Type: string /* max 50 chars */;
}

export type PersonnelTypesRecord = PersonnelTypes;
