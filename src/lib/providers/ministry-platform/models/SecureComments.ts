/**
 * Interface for Secure_Comments
* Table: Secure_Comments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface SecureComments {

  Secure_Comment_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Comment_Date: string /* ISO date (YYYY-MM-DD) */;

  Secure_Comment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Secure_Comment_Types.Secure_Comment_Type_ID, Has Default

  /**
   * Max length: 2147483647 characters
   */
  Secure_Comment: string /* max 2147483647 chars */; // Has Default
}

export type SecureCommentsRecord = SecureComments;
