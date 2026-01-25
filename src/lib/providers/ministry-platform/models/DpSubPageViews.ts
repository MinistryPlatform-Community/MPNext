/**
 * Interface for dp_Sub_Page_Views
* Table: dp_Sub_Page_Views
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpSubPageViews {

  Sub_Page_View_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  View_Title: string /* max 50 chars */;

  Sub_Page_ID: number /* 32-bit integer */; // Foreign Key -> dp_Sub_Pages.Sub_Page_ID

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

  Messaging_View: boolean; // Has Default
}

export type DpSubPageViewsRecord = DpSubPageViews;
