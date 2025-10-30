/**
 * Interface for Location_Groups
* Table: Location_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface LocationGroups {

  Location_Group_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Location_Group?: string /* max 50 chars */ | null;

  Location_Group_Type_ID: number /* 32-bit integer */; // Foreign Key -> Location_Group_Types.Location_Group_Type_ID

  Parent_Location_Group?: number /* 32-bit integer */ | null; // Foreign Key -> Location_Groups.Location_Group_ID
}

export type LocationGroupsRecord = LocationGroups;
