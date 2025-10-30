/**
 * Interface for vw_mp_User_Rights
* Table: vw_mp_User_Rights
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMpUserRights {

  View_ID?: number /* 64-bit integer */ | null; // Primary Key

  /**
   * Max length: 125 characters
   */
  Contact_Display_Name?: string /* max 125 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  Setup_Admin: boolean;

  Can_Impersonate: boolean;

  /**
   * Max length: 21 characters
   */
  Item_Type: string /* max 21 chars */;

  /**
   * Max length: 109 characters
   */
  Item_Name: string /* max 109 chars */;

  /**
   * Max length: 1024 characters
   */
  Item_DB_Reference: string /* max 1024 chars */;

  /**
   * Max length: 9 characters
   */
  Access: string /* max 9 chars */;

  Roles?: number /* 32-bit integer */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Role_List?: string /* max 2147483647 chars */ | null;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID
}

export type VwMpUserRightsRecord = VwMpUserRights;
