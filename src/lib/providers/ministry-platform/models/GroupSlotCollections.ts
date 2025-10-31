/**
 * Interface for Group_Slot_Collections
* Table: Group_Slot_Collections
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupSlotCollections {

  Group_Slot_Collection_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Collection_Name: string /* max 50 chars */;
}

export type GroupSlotCollectionsRecord = GroupSlotCollections;
