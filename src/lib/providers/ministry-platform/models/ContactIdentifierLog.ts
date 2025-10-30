/**
 * Interface for Contact_Identifier_Log
* Table: Contact_Identifier_Log
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ContactIdentifierLog {

  Contact_Identifier_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 50 characters
   */
  Source_System_Name: string /* max 50 chars */;

  /**
   * Max length: 128 characters
   */
  Source_Type_Name: string /* max 128 chars */;

  /**
   * Max length: 4000 characters
   */
  Identifier_Value: string /* max 4000 chars */;

  _Date_Inserted: string /* ISO datetime */; // Read Only, Has Default
}

export type ContactIdentifierLogRecord = ContactIdentifierLog;
