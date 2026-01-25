/**
 * Interface for Meeting_Frequencies
* Table: Meeting_Frequencies
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MeetingFrequencies {

  Meeting_Frequency_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Meeting_Frequency?: string /* max 50 chars */ | null;
}

export type MeetingFrequenciesRecord = MeetingFrequencies;
