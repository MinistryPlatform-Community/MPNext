/**
 * Interface for Pocket_Platform_Speakers
* Table: Pocket_Platform_Speakers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformSpeakers {

  Speaker_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 100 characters
   */
  Display_Name: string /* max 100 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Bio?: string /* max 2147483647 chars */ | null;
}

export type PocketPlatformSpeakersRecord = PocketPlatformSpeakers;
