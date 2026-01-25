/**
 * Interface for Staff
* Table: Staff
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface Staff {

  Staff_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 50 characters
   */
  Title: string /* max 50 chars */;

  Start_Date: string /* ISO datetime */; // Has Default

  End_Date?: string /* ISO datetime */ | null;

  Show_Online: boolean; // Has Default

  Online_Order: unknown; // Has Default

  Facebook_URL?: string /* URL */ | null;
}

export type StaffRecord = Staff;
