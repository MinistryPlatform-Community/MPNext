/**
 * Interface for dp_Notification_Selections
* Table: dp_Notification_Selections
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpNotificationSelections {

  Notification_Selection_ID: number /* 32-bit integer */; // Primary Key

  Notification_ID: number /* 32-bit integer */; // Foreign Key -> dp_Notifications.Notification_ID

  Selection_ID: number /* 32-bit integer */; // Foreign Key -> dp_Selections.Selection_ID
}

export type DpNotificationSelectionsRecord = DpNotificationSelections;
