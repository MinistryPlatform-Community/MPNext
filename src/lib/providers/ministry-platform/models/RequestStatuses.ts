/**
 * Interface for Request_Statuses
* Table: Request_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface RequestStatuses {

  Request_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Request_Status: string /* max 50 chars */;
}

export type RequestStatusesRecord = RequestStatuses;
