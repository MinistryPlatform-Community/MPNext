/**
 * Interface for Pocket_Platform_Transcription_Statuses
* Table: Pocket_Platform_Transcription_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformTranscriptionStatuses {

  Transcription_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Status_Name: string /* max 50 chars */;
}

export type PocketPlatformTranscriptionStatusesRecord = PocketPlatformTranscriptionStatuses;
