/**
 * Interface for vw_mp_Contact_Details
* Table: vw_mp_Contact_Details
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface VwMpContactDetails {

  ID?: number /* 64-bit integer */ | null; // Primary Key

  Contact_ID: number /* 32-bit integer */;

  Household_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 101 characters
   */
  Print_Name?: string /* max 101 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  "Allergies/Special_Needs"?: string /* max 2147483647 chars */ | null;
}

export type VwMpContactDetailsRecord = VwMpContactDetails;
