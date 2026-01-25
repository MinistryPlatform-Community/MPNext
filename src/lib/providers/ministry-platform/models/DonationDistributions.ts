/**
 * Interface for Donation_Distributions
* Table: Donation_Distributions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DonationDistributions {

  Donation_Distribution_ID: number /* 32-bit integer */; // Primary Key

  Donation_ID: number /* 32-bit integer */; // Foreign Key -> Donations.Donation_ID

  Amount: number /* currency amount */;

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Pledge_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledges.Pledge_ID

  Target_Event?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Soft_Credit_Donor?: number /* 32-bit integer */ | null; // Foreign Key -> Donors.Donor_ID

  /**
   * Max length: 1000 characters
   */
  Notes?: string /* max 1000 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Statement_Description?: string /* max 254 chars */ | null;

  Donation_Source_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donation_Sources.Donation_Source_ID

  /**
   * Max length: 16 characters
   */
  _Vendor_Pledge_Code?: string /* max 16 chars */ | null; // Read Only

  Projected_Gift_Frequency?: number /* 32-bit integer */ | null; // Foreign Key -> Frequencies.Frequency_ID

  _Last_Statement_Review?: string /* ISO datetime */ | null; // Read Only

  Soft_Credit_Statement_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contribution_Statements.Statement_ID
}

export type DonationDistributionsRecord = DonationDistributions;
