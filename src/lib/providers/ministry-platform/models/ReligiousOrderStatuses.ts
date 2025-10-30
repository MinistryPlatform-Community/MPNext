/**
 * Interface for Religious_Order_Statuses
* Table: Religious_Order_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ReligiousOrderStatuses {

  Religious_Order_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Religious_Order_Status?: string /* max 50 chars */ | null;
}

export type ReligiousOrderStatusesRecord = ReligiousOrderStatuses;
