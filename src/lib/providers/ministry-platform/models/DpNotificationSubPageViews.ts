/**
 * Interface for dp_Notification_Sub_Page_Views
* Table: dp_Notification_Sub_Page_Views
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpNotificationSubPageViews {

  Notification_Sub_Page_View_ID: number /* 32-bit integer */; // Primary Key

  Notification_ID: number /* 32-bit integer */; // Foreign Key -> dp_Notifications.Notification_ID

  Sub_Page_View_ID: number /* 32-bit integer */; // Foreign Key -> dp_Sub_Page_Views.Sub_Page_View_ID

  Parent_Record_ID: number /* 32-bit integer */;
}

export type DpNotificationSubPageViewsRecord = DpNotificationSubPageViews;
