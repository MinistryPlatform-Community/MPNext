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
   * Max length: 100 characters
   */
  Job_Title?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Phone_Number?: string /* max 100 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Photo_URL?: string /* max 255 chars */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Bio?: string /* max 2147483647 chars */ | null;

  Primary_Ministry: number /* 32-bit integer */; // Foreign Key -> Ministries.Ministry_ID, Has Default

  Primary_Congregation: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID, Has Default

  New_Hire_Evalutation_Complete: boolean; // Has Default

  Declined_401K: boolean; // Has Default

  ACS_Vendor_ID?: number /* 32-bit integer */ | null;

  _Months_of_Service?: number /* 32-bit integer */ | null; // Read Only

  _Completed_Years_of_Service?: number /* 32-bit integer */ | null; // Read Only

  Years_of_Service_Modifier: number /* 32-bit integer */; // Has Default

  Impersonate_All_Time_Off: boolean; // Has Default
}

export type StaffRecord = Staff;
