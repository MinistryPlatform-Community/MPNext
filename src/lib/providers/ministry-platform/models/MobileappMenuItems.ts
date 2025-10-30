/**
 * Interface for MobileApp_Menu_Items
* Table: MobileApp_Menu_Items
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MobileappMenuItems {

  MobileApp_Menu_Item_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Menu_Item: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Icon?: string /* max 50 chars */ | null;

  /**
   * Max length: 512 characters
   */
  Launch_URL: string /* max 512 chars */;

  Send_Authentication: boolean;

  Sort_Order: number /* 32-bit integer */;

  Role_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Roles.Role_ID
}

export type MobileappMenuItemsRecord = MobileappMenuItems;
