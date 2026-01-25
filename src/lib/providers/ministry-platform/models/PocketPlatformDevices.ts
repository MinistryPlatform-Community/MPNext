/**
 * Interface for Pocket_Platform_Devices
* Table: Pocket_Platform_Devices
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformDevices {

  Device_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Hardware_ID: string /* max 50 chars */;

  User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  First_Seen: string /* ISO datetime */; // Has Default

  Last_Seen: string /* ISO datetime */; // Has Default

  /**
   * Max length: 50 characters
   */
  Platform?: string /* max 50 chars */ | null;

  App_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Apps.App_ID
}

export type PocketPlatformDevicesRecord = PocketPlatformDevices;
