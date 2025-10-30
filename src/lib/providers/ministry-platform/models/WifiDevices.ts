/**
 * Interface for Wifi_Devices
* Table: Wifi_Devices
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface WifiDevices {

  Wifi_Device_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Hardware_Mac: string /* max 50 chars */;

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* email, max 254 chars */ | null;

  Mobile_Phone?: string /* phone number */ | null;

  Start_Date: string /* ISO datetime */; // Has Default
}

export type WifiDevicesRecord = WifiDevices;
