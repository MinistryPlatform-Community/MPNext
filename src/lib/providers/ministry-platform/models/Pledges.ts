/**
 * Interface for Pledges
* Table: Pledges
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Pledges {

  Pledge_ID: number /* 32-bit integer */; // Primary Key

  Donor_ID: number /* 32-bit integer */; // Foreign Key -> Donors.Donor_ID

  Pledge_Campaign_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Pledge_Status_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Statuses.Pledge_Status_ID

  Total_Pledge: number /* currency amount */;

  Installments_Planned: number /* 16-bit integer */;

  Installments_Per_Year: number /* 16-bit integer */;

  _Installment_Amount?: number /* currency amount */ | null; // Read Only, Computed

  First_Installment_Date: string /* ISO datetime */;

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Beneficiary?: string /* max 50 chars */ | null;

  Trip_Leader: boolean; // Has Default

  /**
   * Max length: 25 characters
   */
  Currency?: string /* max 25 chars */ | null;

  Parish_Credited_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Parish_Credited_Unknown: boolean; // Has Default

  _Gift_Frequency?: number /* 32-bit integer */ | null; // Foreign Key -> Frequencies.Frequency_ID, Read Only

  Donation_Source_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donation_Sources.Donation_Source_ID

  Send_Pledge_Statement: boolean; // Has Default

  _Original_Amount?: number /* currency amount */ | null; // Read Only

  _Last_Installment_Date?: string /* ISO datetime */ | null; // Read Only, Computed

  Batch_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Batches.Batch_ID
}

export type PledgesRecord = Pledges;
