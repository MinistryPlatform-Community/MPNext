/**
 * Interface for Donations
* Table: Donations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Donations {

  Donation_ID: number /* 32-bit integer */; // Primary Key

  Donor_ID: number /* 32-bit integer */; // Foreign Key -> Donors.Donor_ID

  Donation_Amount: number /* currency amount */;

  Donation_Date: string /* ISO datetime */;

  Payment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Payment_Types.Payment_Type_ID

  /**
   * Max length: 15 characters
   */
  Item_Number?: string /* max 15 chars */ | null;

  Batch_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Batches.Batch_ID

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  Donor_Account_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Donor_Accounts.Donor_Account_ID

  Anonymous: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Transaction_Code?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Subscription_Code?: string /* max 50 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Gateway_Response?: string /* max 500 chars */ | null;

  Processed?: boolean | null;

  /**
   * Max length: 25 characters
   */
  Currency?: string /* max 25 chars */ | null;

  Receipted: boolean; // Has Default

  /**
   * Max length: 25 characters
   */
  Invoice_Number?: string /* max 25 chars */ | null;

  Receipt_Number?: number /* 32-bit integer */ | null;

  /**
   * Max length: 100 characters
   */
  Original_MICR?: string /* max 100 chars */ | null;

  Position?: number /* 32-bit integer */ | null;

  /**
   * Max length: 1000 characters
   */
  OCR_Data?: string /* max 1000 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Third_Party_Note?: string /* max 2147483647 chars */ | null;

  Statement_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contribution_Statements.Statement_ID

  _Last_Statement_Review?: string /* ISO datetime */ | null; // Read Only

  Multiple_Donor_Match: boolean; // Has Default

  _Is_Check_Scan?: boolean | null; // Read Only
}

export type DonationsRecord = Donations;
