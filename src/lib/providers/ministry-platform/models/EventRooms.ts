/**
 * Interface for Event_Rooms
* Table: Event_Rooms
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EventRooms {

  Event_Room_ID: number /* 32-bit integer */; // Primary Key

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Room_ID: number /* 32-bit integer */; // Foreign Key -> Rooms.Room_ID

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Default_Group_Room?: boolean | null;

  Balance_Priority: number /* 32-bit integer */; // Has Default

  Closed: boolean; // Has Default

  Auto_Close_At_Capacity: boolean; // Has Default

  Room_Layout_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Room_Layouts.Room_Layout_ID

  Chairs?: number /* 16-bit integer */ | null;

  Tables?: number /* 16-bit integer */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Notes?: string /* max 2147483647 chars */ | null;

  _Approved?: boolean | null; // Read Only

  Cancelled: boolean; // Has Default

  Checkin_Capacity?: number /* 32-bit integer */ | null;
}

export type EventRoomsRecord = EventRooms;
