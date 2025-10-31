/**
 * Interface for NSM_Student_Statuses
* Table: NSM_Student_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface NsmStudentStatuses {

  Student_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Student_Status: string /* max 50 chars */;
}

export type NsmStudentStatusesRecord = NsmStudentStatuses;
