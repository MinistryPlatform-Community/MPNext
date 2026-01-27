/**
 * Interface for vw_Moody_Distribution_RO
* Table: vw_Moody_Distribution_RO
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMoodyDistributionRo {

  Donation_Date: string /* ISO datetime */;

  Amount: number /* currency amount */;

  /**
   * Max length: 50 characters
   */
  Payment_Type?: string /* max 50 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Item_Number?: string /* max 15 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Statement_Title: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Campaign_Name?: string /* max 50 chars */ | null;

  Donation_ID: number /* 32-bit integer */;

  Donation_Distribution_ID: number /* 32-bit integer */; // Primary Key

  Donor_ID: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Donation_Frequency?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Donation_Level?: string /* max 50 chars */ | null;

  Batch_ID?: number /* 32-bit integer */ | null;

  Pledge_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 75 characters
   */
  Target_Event?: string /* max 75 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Statement_Header?: string /* max 50 chars */ | null;
}

export type VwMoodyDistributionRoRecord = VwMoodyDistributionRo;
