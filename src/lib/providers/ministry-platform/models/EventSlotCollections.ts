/**
 * Interface for Event_Slot_Collections
* Table: Event_Slot_Collections
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface EventSlotCollections {

  Event_Slot_Collection_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Collection_Name: string /* max 50 chars */;
}

export type EventSlotCollectionsRecord = EventSlotCollections;
