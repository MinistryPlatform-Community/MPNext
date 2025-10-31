/**
 * Interface for Volunteer_Statuses
* Table: Volunteer_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface VolunteerStatuses {

  Volunteer_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Volunteer_Status: string /* max 50 chars */;
}

export type VolunteerStatusesRecord = VolunteerStatuses;
