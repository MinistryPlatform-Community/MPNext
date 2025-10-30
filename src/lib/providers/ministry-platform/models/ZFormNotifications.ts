/**
 * Interface for Z_Form_Notifications
* Table: Z_Form_Notifications
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ZFormNotifications {

  Form_ID: number /* 32-bit integer */;

  Response_Message?: number /* 32-bit integer */ | null;

  RM_Template?: number /* 32-bit integer */ | null;
}

export type ZFormNotificationsRecord = ZFormNotifications;
