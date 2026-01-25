/**
 * Interface for Z_Opp_Notifications
* Table: Z_Opp_Notifications
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ZOppNotifications {

  Opportunity_ID: number /* 32-bit integer */;

  Response_Message?: number /* 32-bit integer */ | null;

  RM_Template?: number /* 32-bit integer */ | null;

  Optional_Reminder_Message?: number /* 32-bit integer */ | null;

  OR_Template?: number /* 32-bit integer */ | null;
}

export type ZOppNotificationsRecord = ZOppNotifications;
