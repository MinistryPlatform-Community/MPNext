/**
 * Interface for Meeting_Days
* Table: Meeting_Days
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MeetingDays {

  Meeting_Day_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Meeting_Day: string /* max 50 chars */;
}

export type MeetingDaysRecord = MeetingDays;
