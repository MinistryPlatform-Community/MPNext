/**
 * Interface for Pocket_Platform_Announcement_Types
* Table: Pocket_Platform_Announcement_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformAnnouncementTypes {

  Announcement_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  Sort_Order?: number /* 32-bit integer */ | null;

  Enabled: boolean; // Has Default
}

export type PocketPlatformAnnouncementTypesRecord = PocketPlatformAnnouncementTypes;
