/**
 * Interface for NSM_Student_Types
* Table: NSM_Student_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface NsmStudentTypes {

  Student_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Student_Type: string /* max 50 chars */;
}

export type NsmStudentTypesRecord = NsmStudentTypes;
