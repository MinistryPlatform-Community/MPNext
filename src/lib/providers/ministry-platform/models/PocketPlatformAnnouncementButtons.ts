/**
 * Interface for Pocket_Platform_Announcement_Buttons
* Table: Pocket_Platform_Announcement_Buttons
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformAnnouncementButtons {

  Announcement_Button_ID: number /* 32-bit integer */; // Primary Key

  Announcement_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Announcements.Announcement_ID

  /**
   * Max length: 100 characters
   */
  Button_Text: string /* max 100 chars */;

  /**
   * Max length: 255 characters
   */
  Link_URL: string /* max 255 chars */;

  Start_Date: string /* ISO datetime */; // Has Default

  End_Date?: string /* ISO datetime */ | null;

  Enabled: boolean; // Has Default

  Position?: number /* 32-bit integer */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Web_Link_URL?: string /* max 2147483647 chars */ | null;
}

export type PocketPlatformAnnouncementButtonsRecord = PocketPlatformAnnouncementButtons;
