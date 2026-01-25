/**
 * Interface for Deposits
* Table: Deposits
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Deposits {

  Deposit_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Deposit_Name: string /* max 75 chars */;

  Deposit_Total: number /* currency amount */;

  Deposit_Date: string /* ISO datetime */;

  /**
   * Max length: 30 characters
   */
  Account_Number: string /* max 30 chars */;

  Batch_Count: number /* 32-bit integer */;

  Exported: boolean; // Has Default

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Send_To_Accounting: boolean; // Has Default
}

export type DepositsRecord = Deposits;
