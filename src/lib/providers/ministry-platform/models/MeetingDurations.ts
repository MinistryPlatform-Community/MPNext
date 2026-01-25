/**
 * Interface for Meeting_Durations
* Table: Meeting_Durations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MeetingDurations {

  Meeting_Duration_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Meeting_Duration: string /* max 128 chars */;

  Meeting_Duration_Minutes: number /* 32-bit integer */;
}

export type MeetingDurationsRecord = MeetingDurations;
