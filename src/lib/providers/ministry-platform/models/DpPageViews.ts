/**
 * Interface for dp_Page_Views
* Table: dp_Page_Views
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpPageViews {

  Page_View_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  View_Title: string /* max 50 chars */;

  Page_ID: number /* 32-bit integer */; // Foreign Key -> dp_Pages.Page_ID

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Field_List?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  View_Clause: string /* max 4000 chars */;

  /**
   * Max length: 255 characters
   */
  Order_By?: string /* max 255 chars */ | null;

  User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  User_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID
}

export type DpPageViewsRecord = DpPageViews;
