/**
 * Interface for Pocket_Platform_Transcription
* Table: Pocket_Platform_Transcription
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface PocketPlatformTranscription {

  Transcription_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Transcription_Job_ID: string /* max 50 chars */;

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Status_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Transcription_Statuses.Transcription_Status_ID

  /**
   * Max length: 250 characters
   */
  Progress_Note?: string /* max 250 chars */ | null;

  Sermon_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Sermons.Sermon_ID

  /**
   * Max length: 150 characters
   */
  Final_MP3?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Final_MP4?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Final_Transcription?: string /* max 150 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Raw_Transcription_Text?: string /* max 2147483647 chars */ | null;

  Transcription_Job_Date?: string /* ISO datetime */ | null;

  Transcription_Active: boolean; // Has Default

  MP3_Status: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Transcription_Statuses.Transcription_Status_ID, Has Default

  MP4_Status: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Transcription_Statuses.Transcription_Status_ID, Has Default

  TXT_Status: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Transcription_Statuses.Transcription_Status_ID, Has Default

  M3U8_Status: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Transcription_Statuses.Transcription_Status_ID, Has Default

  /**
   * Max length: 300 characters
   */
  Final_M3U8?: string /* max 300 chars */ | null;

  Video_Duration?: number /* decimal */ | null;

  /**
   * Max length: 7 characters
   */
  Video_Encoding?: string /* max 7 chars */ | null;

  /**
   * Max length: 20 characters
   */
  Video_Quality?: string /* max 20 chars */ | null;

  /**
   * Max length: 400 characters
   */
  Thumbnail_URL?: string /* max 400 chars */ | null;
}

export type PocketPlatformTranscriptionRecord = PocketPlatformTranscription;
