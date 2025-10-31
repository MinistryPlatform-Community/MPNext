/**
 * Interface for Pocket_Platform_Push_Notification_Statuses
* Table: Pocket_Platform_Push_Notification_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformPushNotificationStatuses {

  Push_Notification_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Status_Name: string /* max 50 chars */;
}

export type PocketPlatformPushNotificationStatusesRecord = PocketPlatformPushNotificationStatuses;
