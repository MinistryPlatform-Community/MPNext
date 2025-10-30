/**
 * Interface for dp_Notifications
* Table: dp_Notifications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpNotifications {

  Notification_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 256 characters
   */
  Recurrence_Name: string /* max 256 chars */;

  Last_Execution?: string /* ISO datetime */ | null;

  Next_Execution?: string /* ISO datetime */ | null;

  Notification_Type: unknown; // Has Default

  Template_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  User_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID

  Suppress_Empty_Results: boolean; // Has Default

  Time_Zone: unknown;

  Locale: unknown;

  /**
   * Max length: 256 characters
   */
  Subject?: string /* max 256 chars */ | null;
}

export type DpNotificationsRecord = DpNotifications;
