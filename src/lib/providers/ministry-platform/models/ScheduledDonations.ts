/**
 * Interface for Scheduled_Donations
* Table: Scheduled_Donations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface ScheduledDonations {

  Scheduled_Donation_ID: number /* 32-bit integer */; // Primary Key

  Donor_ID: number /* 32-bit integer */; // Foreign Key -> Donors.Donor_ID

  Donor_Account_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donor_Accounts.Donor_Account_ID

  Day_of_Month: unknown;

  Amount: number /* currency amount */;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Target_Event?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  /**
   * Max length: 1000 characters
   */
  Notes?: string /* max 1000 chars */ | null;

  Payment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Payment_Types.Payment_Type_ID, Has Default

  Gift_Frequency_ID: number /* 32-bit integer */; // Foreign Key -> Frequencies.Frequency_ID, Has Default

  Number_Of_Installments?: number /* 32-bit integer */ | null;

  Day_of_Month_2?: unknown | null;

  /**
   * Max length: 1000 characters
   */
  Third_Party_Note?: string /* max 1000 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Memorized_Batch_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Memorized_Batches.Memorized_Batch_ID
}

export type ScheduledDonationsRecord = ScheduledDonations;
