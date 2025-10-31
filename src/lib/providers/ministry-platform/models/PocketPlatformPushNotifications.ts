/**
 * Interface for Pocket_Platform_Push_Notifications
* Table: Pocket_Platform_Push_Notifications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformPushNotifications {

  Push_Notification_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Message_Title: string /* max 75 chars */;

  /**
   * Max length: 1000 characters
   */
  Message_Body: string /* max 1000 chars */;

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Sent_Date?: string /* ISO datetime */ | null;

  Scheduled_Date?: string /* ISO datetime */ | null;

  Status_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Push_Notification_Statuses.Push_Notification_Status_ID

  To_User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 225 characters
   */
  Action?: string /* max 225 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Payload?: string /* max 500 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Additional_Information?: string /* max 500 chars */ | null;

  App_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Apps.App_ID
}

export type PocketPlatformPushNotificationsRecord = PocketPlatformPushNotifications;
