/**
 * Interface for Pocket_Platform_Sermon_Links
* Table: Pocket_Platform_Sermon_Links
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformSermonLinks {

  Sermon_Link_ID: number /* 32-bit integer */; // Primary Key

  Sermon_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Sermons.Sermon_ID

  Link_Type_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Sermon_Link_Types.Sermon_Link_Type_ID

  /**
   * Max length: 1000 characters
   */
  Link_URL?: string /* max 1000 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Podcast_Description?: string /* max 2147483647 chars */ | null;

  Status_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Statuses.Status_ID

  Use_In_Audio_Podcast?: boolean | null;

  Use_in_Video_Podcast?: boolean | null;

  /**
   * Max length: 10 characters
   */
  File_Size?: string /* max 10 chars */ | null;

  /**
   * Max length: 10 characters
   */
  File_Units?: string /* max 10 chars */ | null;

  /**
   * Max length: 10 characters
   */
  File_Duration?: string /* max 10 chars */ | null;

  Position?: number /* 32-bit integer */ | null;

  Video_Duration?: number /* 32-bit integer */ | null;

  /**
   * Max length: 500 characters
   */
  HLS_Thumbnail?: string /* max 500 chars */ | null;

  /**
   * Max length: 4 characters
   */
  Video_Quality?: string /* max 4 chars */ | null;
}

export type PocketPlatformSermonLinksRecord = PocketPlatformSermonLinks;
