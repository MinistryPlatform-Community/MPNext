/**
 * Interface for Prayer_Engagements
* Table: Prayer_Engagements
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PrayerEngagements {

  Prayer_Engagement_ID: number /* 32-bit integer */; // Primary Key

  Prayer_Request_ID: number /* 32-bit integer */; // Foreign Key -> Prayer_Requests.Prayer_Request_ID

  Prayer_Engagement_Type_ID: number /* 32-bit integer */; // Foreign Key -> Prayer_Engagement_Types.Prayer_Engagement_Type_ID

  /**
   * Max length: 2147483647 characters
   */
  Notes?: string /* max 2147483647 chars */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID
}

export type PrayerEngagementsRecord = PrayerEngagements;
