/**
 * Interface for Fiscal_Years
* Table: Fiscal_Years
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface FiscalYears {

  Fiscal_Year_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Fiscal_Year_Name: string /* max 50 chars */;

  Fiscal_Year_Start: string /* ISO datetime */;

  _Fiscal_Year_End?: string /* ISO datetime */ | null; // Read Only, Computed

  _Fiscal_Year_Complete?: number /* decimal */ | null; // Read Only, Computed

  Accounting_Company_ID: number /* 32-bit integer */; // Foreign Key -> Accounting_Companies.Accounting_Company_ID, Has Default

  /**
   * Max length: 500 characters
   */
  Fiscal_Year_Notes?: string /* max 500 chars */ | null;
}

export type FiscalYearsRecord = FiscalYears;
