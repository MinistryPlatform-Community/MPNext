/**
 * Interface for Item_Priorities
* Table: Item_Priorities
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ItemPriorities {

  Item_Priority_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Priority: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type ItemPrioritiesRecord = ItemPriorities;
