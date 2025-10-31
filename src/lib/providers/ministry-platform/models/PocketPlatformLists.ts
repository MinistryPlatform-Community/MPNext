/**
 * Interface for Pocket_Platform_Lists
* Table: Pocket_Platform_Lists
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface PocketPlatformLists {

  List_ID: number /* 32-bit integer */; // Primary Key

  Parent_List_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Lists.List_ID

  /**
   * Max length: 255 characters
   */
  Title: string /* max 255 chars */;

  /**
   * Max length: 255 characters
   */
  Display_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Subtitle?: string /* max 255 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Description?: string /* max 1000 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Link_URL?: string /* max 2000 chars */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Position?: number /* 32-bit integer */ | null;

  Screen_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Screens.Screen_ID

  /**
   * Max length: 1000 characters
   */
  Imported_ID?: string /* max 1000 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type PocketPlatformListsRecord = PocketPlatformLists;
