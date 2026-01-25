/**
 * Interface for RSVP_Statuses
* Table: RSVP_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface RsvpStatuses {

  RSVP_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  RSVP_Status: string /* max 50 chars */;
}

export type RsvpStatusesRecord = RsvpStatuses;
