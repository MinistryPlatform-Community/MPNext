/**
 * Interface for Event_Groups
* Table: Event_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EventGroups {

  Event_Group_ID: number /* 32-bit integer */; // Primary Key

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Room_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID

  Closed?: boolean | null;

  Curriculum_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Curriculum.Curriculum_ID
}

export type EventGroupsRecord = EventGroups;
