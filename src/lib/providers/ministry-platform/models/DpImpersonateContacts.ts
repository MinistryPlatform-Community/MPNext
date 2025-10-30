/**
 * Interface for dp_Impersonate_Contacts
* Table: dp_Impersonate_Contacts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpImpersonateContacts {

  Impersonate_Contact_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 255 characters
   */
  Notes?: string /* max 255 chars */ | null;
}

export type DpImpersonateContactsRecord = DpImpersonateContacts;
