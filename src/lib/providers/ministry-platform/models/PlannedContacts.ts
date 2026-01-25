/**
 * Interface for Planned_Contacts
* Table: Planned_Contacts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PlannedContacts {

  Planned_Contact_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Planned_Contact_Title: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Instructions?: string /* max 500 chars */ | null;

  Manager: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Hours_Until_Past_Due: number /* 32-bit integer */;

  Maximum_Attempts: number /* 32-bit integer */;

  Notify_On_Max_Attempts: boolean; // Has Default

  Notify_On_Failure: boolean; // Has Default

  Next_Planned_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Planned_Contacts.Planned_Contact_ID

  Next_Contact_By?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Days_Until_Next_Contact?: number /* 32-bit integer */ | null;

  Call_Team?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID
}

export type PlannedContactsRecord = PlannedContacts;
