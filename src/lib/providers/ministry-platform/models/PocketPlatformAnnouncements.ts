/**
 * Interface for Pocket_Platform_Announcements
* Table: Pocket_Platform_Announcements
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformAnnouncements {

  Announcement_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Announcement_Title?: string /* max 100 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Body?: string /* max 2147483647 chars */ | null;

  Start_Date: string /* ISO datetime */; // Has Default

  End_Date?: string /* ISO datetime */ | null;

  Enabled: boolean; // Has Default

  /**
   * Max length: 255 characters
   */
  Link_URL?: string /* max 255 chars */ | null;

  Position?: number /* 32-bit integer */ | null;

  Announcement_Type_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Announcement_Types.Announcement_Type_ID, Has Default

  Announcement_Sort_Order?: number /* 32-bit integer */ | null;

  Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Opportunity_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Opportunities.Opportunity_ID

  /**
   * Max length: 255 characters
   */
  Web_Link_URL?: string /* max 255 chars */ | null;

  Dismissible?: boolean | null; // Has Default

  Show_In_App: boolean; // Has Default

  Show_Image_In_App: boolean; // Has Default

  Show_In_Email: boolean; // Has Default

  Show_Image_In_Email: boolean; // Has Default

  Show_On_Web: boolean; // Has Default

  Show_Image_On_Web: boolean; // Has Default

  Show_Image_Only: boolean; // Has Default

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Audience_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Audiences.Audience_ID
}

export type PocketPlatformAnnouncementsRecord = PocketPlatformAnnouncements;
