/**
 * Interface for Group_Rooms
* Table: Group_Rooms
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupRooms {

  Group_Room_ID: number /* 32-bit integer */; // Primary Key

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Room_ID: number /* 32-bit integer */; // Foreign Key -> Rooms.Room_ID

  Default_Room: boolean; // Has Default

  Discontinued: boolean; // Has Default
}

export type GroupRoomsRecord = GroupRooms;
