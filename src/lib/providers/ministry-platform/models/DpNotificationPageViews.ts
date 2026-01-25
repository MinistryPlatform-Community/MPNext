/**
 * Interface for dp_Notification_Page_Views
* Table: dp_Notification_Page_Views
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpNotificationPageViews {

  Notification_Page_View_ID: number /* 32-bit integer */; // Primary Key

  Notification_ID: number /* 32-bit integer */; // Foreign Key -> dp_Notifications.Notification_ID

  Page_View_ID: number /* 32-bit integer */; // Foreign Key -> dp_Page_Views.Page_View_ID
}

export type DpNotificationPageViewsRecord = DpNotificationPageViews;
