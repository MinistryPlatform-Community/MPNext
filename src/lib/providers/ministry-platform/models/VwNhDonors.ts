/**
 * Interface for vw_nh_donors
* Table: vw_nh_donors
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwNhDonors {

  Donor_ID?: number /* 32-bit integer */ | null; // Primary Key

  /**
   * Max length: 125 characters
   */
  Display_Name: string /* max 125 chars */;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Prefix?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Contact_Status: string /* max 50 chars */;

  Date_of_Birth?: string /* ISO date (YYYY-MM-DD) */ | null;

  Age?: unknown | null;

  Home_Phone?: string /* phone number */ | null;

  Mobile_Phone?: string /* phone number */ | null;

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* email, max 254 chars */ | null;

  Bulk_Mail_Opt_Out: boolean;

  /**
   * Max length: 75 characters
   */
  Current_Mail_Address_Line_1?: string /* max 75 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Current_Mail_Address_Line_2?: string /* max 75 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Current_Mail_City?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Current_Mail_State?: string /* max 50 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Current_Mail_Postal_Code?: string /* max 15 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Current_Mail_Foreign_Country?: string /* max 255 chars */ | null;

  Major_Donor?: boolean | null;

  Recurring_Donor?: boolean | null;

  First_Donation?: string /* ISO datetime */ | null;

  Last_Donation?: string /* ISO datetime */ | null;

  Donation_Count?: number /* 32-bit integer */ | null;

  Donations_This_Year?: number /* 32-bit integer */ | null;

  Donations_Last_Year?: number /* 32-bit integer */ | null;

  Contact_ID: number /* 32-bit integer */;

  Congregation_ID?: number /* 32-bit integer */ | null;
}

export type VwNhDonorsRecord = VwNhDonors;
