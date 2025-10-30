/**
 * Interface for Program_Groups
* Table: Program_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ProgramGroups {

  Program_Group_ID: number /* 32-bit integer */; // Primary Key

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Room_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;
}

export type ProgramGroupsRecord = ProgramGroups;
