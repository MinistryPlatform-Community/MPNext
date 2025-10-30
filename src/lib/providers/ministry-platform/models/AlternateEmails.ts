/**
 * Interface for Alternate_Emails
* Table: Alternate_Emails
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AlternateEmails {

  Alternate_Email_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Alternate_Email_Type_ID: number /* 32-bit integer */; // Foreign Key -> Alternate_Email_Types.Alternate_Email_Type_ID

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* email, max 254 chars */ | null;
}

export type AlternateEmailsRecord = AlternateEmails;
