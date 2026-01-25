/**
 * Interface for Donors
* Table: Donors
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Donors {

  Donor_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Statement_Frequency_ID: number /* 32-bit integer */; // Foreign Key -> Statement_Frequencies.Statement_Frequency_ID

  Statement_Type_ID: number /* 32-bit integer */; // Foreign Key -> Statement_Types.Statement_Type_ID, Has Default

  Statement_Method_ID: number /* 32-bit integer */; // Foreign Key -> Statement_Methods.Statement_Method_ID

  Envelope_No?: number /* 32-bit integer */ | null;

  Cancel_Envelopes: boolean; // Has Default

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  Always_Soft_Credit?: number /* 32-bit integer */ | null; // Foreign Key -> Donors.Donor_ID

  Always_Pledge_Credit?: number /* 32-bit integer */ | null; // Foreign Key -> Donors.Donor_ID

  Setup_Date: string /* ISO datetime */;

  First_Contact_Made?: boolean | null;

  _First_Donation_Date?: string /* ISO datetime */ | null; // Read Only

  _Last_Donation_Date?: string /* ISO datetime */ | null; // Read Only

  Donation_Frequency_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donation_Frequencies.Donation_Frequency_ID

  Donation_Level_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donation_Levels.Donation_Level_ID

  /**
   * Max length: 16 characters
   */
  Donor_Code?: string /* max 16 chars */ | null;
}

export type DonorsRecord = Donors;
