/**
 * Interface for Ministries
* Table: Ministries
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Ministries {

  Ministry_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Ministry_Name: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Primary_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Parent_Ministry?: number /* 32-bit integer */ | null; // Foreign Key -> Ministries.Ministry_ID

  Available_Online: boolean; // Has Default

  Priority_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Priorities.Priority_ID

  Leadership_Team?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID
}

export type MinistriesRecord = Ministries;
