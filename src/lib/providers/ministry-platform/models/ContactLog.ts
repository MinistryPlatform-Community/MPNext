/**
 * Interface for Contact_Log
* Table: Contact_Log
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ContactLog {

  Contact_Log_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Contact_Date: string /* ISO datetime */;

  Contact_Log_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contact_Log_Types.Contact_Log_Type_ID

  Made_By: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 2000 characters
   */
  Notes: string /* max 2000 chars */;

  Planned_Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Planned_Contacts.Planned_Contact_ID

  Contact_Successful?: boolean | null;

  Original_Contact_Log_Entry?: number /* 32-bit integer */ | null; // Foreign Key -> Contact_Log.Contact_Log_ID

  Feedback_Entry_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Feedback_Entries.Feedback_Entry_ID
}

export type ContactLogRecord = ContactLog;
