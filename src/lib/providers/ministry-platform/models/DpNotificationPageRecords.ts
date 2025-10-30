/**
 * Interface for dp_Notification_Page_Records
* Table: dp_Notification_Page_Records
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpNotificationPageRecords {

  Notification_Record_ID: number /* 32-bit integer */; // Primary Key

  Notification_ID: number /* 32-bit integer */; // Foreign Key -> dp_Notifications.Notification_ID

  Page_ID: number /* 32-bit integer */; // Foreign Key -> dp_Pages.Page_ID

  Record_ID: number /* 32-bit integer */;

  /**
   * Max length: 255 characters
   */
  Record_Description: string /* max 255 chars */; // Has Default
}

export type DpNotificationPageRecordsRecord = DpNotificationPageRecords;
