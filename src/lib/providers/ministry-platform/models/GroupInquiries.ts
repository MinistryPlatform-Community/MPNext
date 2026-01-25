/**
 * Interface for Group_Inquiries
* Table: Group_Inquiries
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface GroupInquiries {

  Group_Inquiry_ID: number /* 32-bit integer */; // Primary Key

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Inquiry_Date: string /* ISO datetime */; // Has Default

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  Phone?: string /* phone number */ | null;

  /**
   * Max length: 254 characters
   */
  Email?: string /* max 254 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Comments?: string /* max 1000 chars */ | null;

  Placed?: boolean | null;

  _From_Group_Finder?: boolean | null; // Read Only, Has Default
}

export type GroupInquiriesRecord = GroupInquiries;
