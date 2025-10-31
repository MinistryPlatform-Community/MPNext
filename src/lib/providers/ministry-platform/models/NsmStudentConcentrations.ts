/**
 * Interface for NSM_Student_Concentrations
* Table: NSM_Student_Concentrations
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface NsmStudentConcentrations {

  Student_Concentration_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Student_Concentration: string /* max 50 chars */;
}

export type NsmStudentConcentrationsRecord = NsmStudentConcentrations;
