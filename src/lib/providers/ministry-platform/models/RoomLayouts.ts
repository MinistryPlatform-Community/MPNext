/**
 * Interface for Room_Layouts
* Table: Room_Layouts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface RoomLayouts {

  Room_Layout_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Layout_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Capacity?: number /* 16-bit integer */ | null;

  Table_Count?: number /* 16-bit integer */ | null;

  Chair_Count?: number /* 16-bit integer */ | null;

  Setup_Minutes?: number /* 16-bit integer */ | null;

  Room_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID
}

export type RoomLayoutsRecord = RoomLayouts;
