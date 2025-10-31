/**
 * Interface for Group_Slots
* Table: Group_Slots
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupSlots {

  Group_Slot_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Subtitle?: string /* max 50 chars */ | null;

  Date: string /* ISO datetime */;

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Num_Slots: number /* 32-bit integer */;

  Primary_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Position?: number /* 32-bit integer */ | null;
}

export type GroupSlotsRecord = GroupSlots;
