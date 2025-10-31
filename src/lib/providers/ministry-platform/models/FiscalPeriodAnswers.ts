/**
 * Interface for Fiscal_Period_Answers
* Table: Fiscal_Period_Answers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface FiscalPeriodAnswers {

  Fiscal_Period_Answer_ID: number /* 32-bit integer */; // Primary Key

  Fiscal_Period_ID: number /* 32-bit integer */; // Foreign Key -> Fiscal_Periods.Fiscal_Period_ID

  Ministry_Question_ID: number /* 32-bit integer */; // Foreign Key -> Ministry_Questions.Ministry_Question_ID

  Numerical_Value: number /* decimal */; // Has Default

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Ministry_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Ministries.Ministry_ID

  Program_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID

  /**
   * Max length: 100 characters
   */
  Type?: string /* max 100 chars */ | null;

  _Date_Added: string /* ISO datetime */; // Read Only, Has Default
}

export type FiscalPeriodAnswersRecord = FiscalPeriodAnswers;
