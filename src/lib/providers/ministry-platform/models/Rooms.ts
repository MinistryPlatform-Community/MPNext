/**
 * Interface for Rooms
* Table: Rooms
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Rooms {

  Room_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Room_Name: string /* max 50 chars */;

  /**
   * Max length: 15 characters
   */
  Room_Number?: string /* max 15 chars */ | null;

  Building_ID: number /* 32-bit integer */; // Foreign Key -> Buildings.Building_ID

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Maximum_Capacity: number /* 16-bit integer */;

  Default_Room_Layout?: number /* 32-bit integer */ | null; // Foreign Key -> Room_Layouts.Room_Layout_ID

  Room_Usage_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Room_Usage_Types.Room_Usage_Type_ID

  Bookable: boolean; // Has Default

  Last_Remodel_Date?: string /* ISO datetime */ | null;

  Parent_Room_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID

  Auto_Approve: boolean; // Has Default

  Print_Server_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Print_Servers.Print_Server_ID

  /**
   * Max length: 128 characters
   */
  Printer_Name?: string /* max 128 chars */ | null;
}

export type RoomsRecord = Rooms;
