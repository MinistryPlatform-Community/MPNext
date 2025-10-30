/**
 * Interface for Background_Check_Statuses
* Table: Background_Check_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface BackgroundCheckStatuses {

  Background_Check_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Background_Check_Status: string /* max 50 chars */;
}

export type BackgroundCheckStatusesRecord = BackgroundCheckStatuses;
