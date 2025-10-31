/**
 * Interface for Group_Collection_Groups
* Table: Group_Collection_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface GroupCollectionGroups {

  /**
   * Max length: 50 characters
   */
  Name: string /* max 50 chars */;

  Group_Collection_Group_ID: number /* 32-bit integer */; // Primary Key

  Group_Collection_ID: number /* 32-bit integer */; // Foreign Key -> Group_Collections.Group_Collection_ID

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Position: number /* 32-bit integer */; // Has Default
}

export type GroupCollectionGroupsRecord = GroupCollectionGroups;
