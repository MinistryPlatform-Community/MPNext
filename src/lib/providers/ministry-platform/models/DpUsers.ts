/**
 * Interface for dp_Users
* Table: dp_Users
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpUsers {

  User_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 254 characters
   */
  User_Name: string /* max 254 chars */;

  /**
   * Max length: 254 characters
   */
  User_Email?: string /* max 254 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Display_Name?: string /* max 75 chars */ | null;

  Password?: string /* password hash */ | null;

  Admin: boolean; // Has Default

  Publications_Manager: boolean; // Has Default

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Supervisor?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  User_GUID: string /* GUID/UUID */; // Has Default

  Can_Impersonate: boolean; // Has Default

  In_Recovery?: boolean | null;

  Time_Zone?: unknown | null;

  Locale?: unknown | null;

  /**
   * Max length: 32 characters
   */
  Theme?: string /* max 32 chars */ | null;

  Setup_Admin: boolean; // Has Default

  Read_Permitted: boolean; // Has Default

  Create_Permitted: boolean; // Has Default

  Update_Permitted: boolean; // Has Default

  Delete_Permitted: boolean; // Has Default

  Login_Attempts: number /* 32-bit integer */; // Has Default

  MFA_Required?: boolean | null;
}

export type DpUsersRecord = DpUsers;
