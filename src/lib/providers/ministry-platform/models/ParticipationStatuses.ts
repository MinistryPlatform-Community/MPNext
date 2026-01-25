/**
 * Interface for Participation_Statuses
* Table: Participation_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ParticipationStatuses {

  Participation_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Participation_Status: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type ParticipationStatusesRecord = ParticipationStatuses;
