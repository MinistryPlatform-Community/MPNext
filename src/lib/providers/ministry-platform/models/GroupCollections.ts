/**
 * Interface for Group_Collections
* Table: Group_Collections
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface GroupCollections {

  Group_Collection_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Name: string /* max 50 chars */;
}

export type GroupCollectionsRecord = GroupCollections;
