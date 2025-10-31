/**
 * Interface for NSM_Student_Graduation_Types
* Table: NSM_Student_Graduation_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface NsmStudentGraduationTypes {

  Student_Graduation_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Student_Graduation_Type: string /* max 50 chars */;
}

export type NsmStudentGraduationTypesRecord = NsmStudentGraduationTypes;
