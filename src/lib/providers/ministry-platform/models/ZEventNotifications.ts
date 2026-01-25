/**
 * Interface for Z_Event_Notifications
* Table: Z_Event_Notifications
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ZEventNotifications {

  Event_ID: number /* 32-bit integer */;

  Registrant_Message?: number /* 32-bit integer */ | null;

  RM_Template?: number /* 32-bit integer */ | null;

  Optional_Reminder_Message?: number /* 32-bit integer */ | null;

  OR_Template?: number /* 32-bit integer */ | null;

  Attendee_Message?: number /* 32-bit integer */ | null;

  AM_Template?: number /* 32-bit integer */ | null;
}

export type ZEventNotificationsRecord = ZEventNotifications;
