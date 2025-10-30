/**
 * Interface for Donor_Accounts
* Table: Donor_Accounts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DonorAccounts {

  Donor_Account_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Institution_Name: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Account_Number: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Routing_Number?: string /* max 50 chars */ | null;

  Donor_ID: number /* 32-bit integer */; // Foreign Key -> Donors.Donor_ID

  "Non-Assignable": boolean;

  Account_Type_ID: number /* 32-bit integer */; // Foreign Key -> Account_Types.Account_Type_ID

  Closed: boolean;

  Bank_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Banks.Bank_ID
}

export type DonorAccountsRecord = DonorAccounts;
