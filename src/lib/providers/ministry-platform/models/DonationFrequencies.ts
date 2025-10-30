/**
 * Interface for Donation_Frequencies
* Table: Donation_Frequencies
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DonationFrequencies {

  Donation_Frequency_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Donation_Frequency: string /* max 50 chars */;

  Evaluation_Days: number /* 32-bit integer */; // Has Default

  Evaluation_Order: number /* 32-bit integer */; // Has Default

  Minimum_Donations: number /* 32-bit integer */; // Has Default

  Evaluation_Delay: number /* 32-bit integer */; // Has Default
}

export type DonationFrequenciesRecord = DonationFrequencies;
