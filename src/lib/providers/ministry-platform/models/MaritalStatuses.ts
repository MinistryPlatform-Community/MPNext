/**
 * Interface for Marital_Statuses
* Table: Marital_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MaritalStatuses {

  Marital_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 25 characters
   */
  Marital_Status: string /* max 25 chars */;
}

export type MaritalStatusesRecord = MaritalStatuses;
