/**
 * Interface for Prayer_BannedUsers
* Table: Prayer_BannedUsers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PrayerBannedusers {

  Prayer_BannedUser_ID: number /* 32-bit integer */; // Primary Key

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Start_Date: string /* ISO datetime */; // Has Default
}

export type PrayerBannedusersRecord = PrayerBannedusers;
