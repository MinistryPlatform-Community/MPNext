/**
 * Interface for Event_Slots
* Table: Event_Slots
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface EventSlots {

  Event_Slot_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Subtitle?: string /* max 50 chars */ | null;

  Date: string /* ISO datetime */;

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Num_Slots: number /* 32-bit integer */;

  Primary_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Position?: number /* 32-bit integer */ | null;
}

export type EventSlotsRecord = EventSlots;
