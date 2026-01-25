/**
 * Interface for Scheduled_Donation_Distributions
* Table: Scheduled_Donation_Distributions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ScheduledDonationDistributions {

  Scheduled_Donation_Distribution_ID: number /* 32-bit integer */; // Primary Key

  Scheduled_Donation_ID: number /* 32-bit integer */; // Foreign Key -> Scheduled_Donations.Scheduled_Donation_ID

  Amount: number /* currency amount */;

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Pledge_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledges.Pledge_ID

  Donation_Source_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donation_Sources.Donation_Source_ID

  Parish_Credited_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 1000 characters
   */
  Notes?: string /* max 1000 chars */ | null;

  Target_Event?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID
}

export type ScheduledDonationDistributionsRecord = ScheduledDonationDistributions;
