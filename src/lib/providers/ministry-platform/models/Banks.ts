/**
 * Interface for Banks
* Table: Banks
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Banks {

  Bank_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Bank_Name: string /* max 75 chars */;

  Accounting_Company_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Accounting_Companies.Accounting_Company_ID

  Address_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  /**
   * Max length: 25 characters
   */
  Account_Number?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Accounting_Company?: string /* max 25 chars */ | null;
}

export type BanksRecord = Banks;
