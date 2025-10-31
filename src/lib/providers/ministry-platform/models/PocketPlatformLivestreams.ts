/**
 * Interface for Pocket_Platform_Livestreams
* Table: Pocket_Platform_Livestreams
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach
 * Generated from column metadata
 */
export interface PocketPlatformLivestreams {

  Livestream_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 150 characters
   */
  Stream_Title: string /* max 150 chars */;

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date: string /* ISO datetime */;

  /**
   * Max length: 512 characters
   */
  Stream_URL?: string /* max 512 chars */ | null;

  Sort_Order?: number /* 32-bit integer */ | null; // Has Default

  Sermon_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Sermons.Sermon_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type PocketPlatformLivestreamsRecord = PocketPlatformLivestreams;
