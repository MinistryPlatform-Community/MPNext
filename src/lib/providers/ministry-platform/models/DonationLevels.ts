/**
 * Interface for Donation_Levels
* Table: Donation_Levels
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DonationLevels {

  Donation_Level_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Donation_Level?: string /* max 50 chars */ | null;

  Evaluation_Days: number /* 32-bit integer */; // Has Default

  Evaluation_Order: number /* 32-bit integer */; // Has Default

  Minimum_Donations: number /* currency amount */; // Has Default

  Evaluation_Delay: number /* 32-bit integer */; // Has Default
}

export type DonationLevelsRecord = DonationLevels;
