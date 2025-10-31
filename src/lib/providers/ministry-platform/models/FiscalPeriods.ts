/**
 * Interface for Fiscal_Periods
* Table: Fiscal_Periods
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface FiscalPeriods {

  Fiscal_Period_ID: number /* 32-bit integer */; // Primary Key

  Fiscal_Year_ID: number /* 32-bit integer */; // Foreign Key -> Fiscal_Years.Fiscal_Year_ID

  Fiscal_Period_Start: string /* ISO datetime */;

  _Fiscal_Period_End?: string /* ISO datetime */ | null; // Read Only, Computed

  /**
   * Max length: 30 characters
   */
  _Fiscal_Period_Name?: string /* max 30 chars */ | null; // Read Only, Computed

  /**
   * Max length: 500 characters
   */
  Fiscal_Period_Notes?: string /* max 500 chars */ | null;

  _Fiscal_Period_Complete?: number /* decimal */ | null; // Read Only, Computed

  _Sundays: number /* 32-bit integer */; // Read Only, Has Default
}

export type FiscalPeriodsRecord = FiscalPeriods;
