/**
 * Interface for Pocket_Platform_Statuses
* Table: Pocket_Platform_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformStatuses {

  Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Status: string /* max 50 chars */;
}

export type PocketPlatformStatusesRecord = PocketPlatformStatuses;
