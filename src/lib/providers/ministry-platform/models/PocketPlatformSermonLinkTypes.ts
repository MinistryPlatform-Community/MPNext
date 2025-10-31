/**
 * Interface for Pocket_Platform_Sermon_Link_Types
* Table: Pocket_Platform_Sermon_Link_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformSermonLinkTypes {

  Sermon_Link_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Sermon_Link_Type: string /* max 50 chars */;

  Icon_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Icons.Icon_ID

  Media_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Media_Types.Media_Type_ID

  Show_On_Widget_Listen_Menu: boolean; // Has Default

  Priority?: number /* 32-bit integer */ | null;

  Show_On_Widget: boolean; // Has Default

  Show_On_Widget_Series_List: boolean; // Has Default

  Use_As_Trailer: boolean; // Has Default
}

export type PocketPlatformSermonLinkTypesRecord = PocketPlatformSermonLinkTypes;
