/**
 * Interface for Contact_Private_Notes
* Table: Contact_Private_Notes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ContactPrivateNotes {

  Contact_Private_Note_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 2000 characters
   */
  Notes: string /* max 2000 chars */;

  Start_Date: string /* ISO datetime */; // Has Default
}

export type ContactPrivateNotesRecord = ContactPrivateNotes;
