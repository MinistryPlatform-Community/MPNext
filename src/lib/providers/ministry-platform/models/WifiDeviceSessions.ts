/**
 * Interface for Wifi_Device_Sessions
* Table: Wifi_Device_Sessions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface WifiDeviceSessions {

  Wifi_Device_Session_ID: number /* 32-bit integer */; // Primary Key

  Wifi_Device_ID: number /* 32-bit integer */; // Foreign Key -> Wifi_Devices.Wifi_Device_ID

  /**
   * Max length: 128 characters
   */
  Session_GUID: string /* max 128 chars */;

  Session_Start: string /* ISO datetime */;

  Session_End?: string /* ISO datetime */ | null;

  /**
   * Max length: 50 characters
   */
  Wifi_Space: string /* max 50 chars */;

  Duration_in_Minutes: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Contact_ID_Value?: string /* max 50 chars */ | null;
}

export type WifiDeviceSessionsRecord = WifiDeviceSessions;
