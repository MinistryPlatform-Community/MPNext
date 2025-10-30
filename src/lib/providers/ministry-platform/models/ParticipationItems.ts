/**
 * Interface for Participation_Items
* Table: Participation_Items
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ParticipationItems {

  Participation_Item_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Participation_Item: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type ParticipationItemsRecord = ParticipationItems;
