/**
 * Interface for Personnel_Assignment_Types
* Table: Personnel_Assignment_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelAssignmentTypes {

  Personnel_Assignment_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Personnel_Assignment_Type: string /* max 50 chars */;
}

export type PersonnelAssignmentTypesRecord = PersonnelAssignmentTypes;
