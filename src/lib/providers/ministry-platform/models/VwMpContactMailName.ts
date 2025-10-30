/**
 * Interface for vw_mp_contact_mail_name
* Table: vw_mp_contact_mail_name
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMpContactMailName {

  Contact_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 125 characters
   */
  Display_Name: string /* max 125 chars */;

  Household_ID?: number /* 32-bit integer */ | null;

  Household_Position_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  Prefix?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Suffix?: string /* max 50 chars */ | null;

  Gender_ID?: number /* 32-bit integer */ | null;

  Position?: number /* 64-bit integer */ | null;

  Company: boolean;

  Spouse_Contact_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Prefix?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Suffix?: string /* max 50 chars */ | null;

  /**
   * Max length: 125 characters
   */
  Spouse_Display_Name?: string /* max 125 chars */ | null;

  Spouse_Gender_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 409 characters
   */
  Joint_Mail_Name_Formal: string /* max 409 chars */;

  /**
   * Max length: 103 characters
   */
  Salutation_First_Names?: string /* max 103 chars */ | null;

  /**
   * Max length: 103 characters
   */
  Salutation_Nicknames?: string /* max 103 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Company_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 125 characters
   */
  Sort_Name?: string /* max 125 chars */ | null;
}

export type VwMpContactMailNameRecord = VwMpContactMailName;
