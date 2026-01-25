/**
 * Interface for vw_mp_Projected_Scheduled_Donations
* Table: vw_mp_Projected_Scheduled_Donations
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwMpProjectedScheduledDonations {

  ID?: number /* 64-bit integer */ | null; // Primary Key

  Scheduled_Donation_ID: number /* 32-bit integer */; // Foreign Key -> Scheduled_Donations.Scheduled_Donation_ID

  Donor_ID: number /* 32-bit integer */; // Foreign Key -> Donors.Donor_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Donor_Account_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donor_Accounts.Donor_Account_ID

  Amount: number /* currency amount */;

  Day_of_Month_1: unknown;

  Day_of_Month_2?: unknown | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Target_Event?: number /* 32-bit integer */ | null;

  /**
   * Max length: 1000 characters
   */
  Notes?: string /* max 1000 chars */ | null;

  Payment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Payment_Types.Payment_Type_ID

  Gift_Frequency_ID: number /* 32-bit integer */; // Foreign Key -> Frequencies.Frequency_ID

  /**
   * Max length: 128 characters
   */
  Gift_Frequency: string /* max 128 chars */;

  Number_Of_Installments?: number /* 32-bit integer */ | null;

  /**
   * Max length: 1000 characters
   */
  Third_Party_Note?: string /* max 1000 chars */ | null;

  Projected_Donation_Date?: string /* ISO datetime */ | null;
}

export type VwMpProjectedScheduledDonationsRecord = VwMpProjectedScheduledDonations;
