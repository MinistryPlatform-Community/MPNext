/**
 * Interface for NSM_Student_Sources
* Table: NSM_Student_Sources
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface NsmStudentSources {

  Student_Source_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Student_Source: string /* max 50 chars */;
}

export type NsmStudentSourcesRecord = NsmStudentSources;
