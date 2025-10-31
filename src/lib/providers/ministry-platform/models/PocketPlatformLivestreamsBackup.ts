/**
 * Interface for Pocket_Platform_Livestreams_Backup
* Table: Pocket_Platform_Livestreams_Backup
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach
 * Generated from column metadata
 */
export interface PocketPlatformLivestreamsBackup {

  Livestream_Object_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 150 characters
   */
  Livestream_Title: string /* max 150 chars */;

  /**
   * Max length: 500 characters
   */
  Livestream_Description: string /* max 500 chars */;

  /**
   * Max length: 200 characters
   */
  Livestream_Source: string /* max 200 chars */;

  Livestream_Active: boolean; // Has Default

  Sort_Order?: number /* 32-bit integer */ | null; // Has Default
}

export type PocketPlatformLivestreamsBackupRecord = PocketPlatformLivestreamsBackup;
