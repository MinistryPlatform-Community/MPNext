/**
 * Interface for Ministry_Weeks
* Table: Ministry_Weeks
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface MinistryWeeks {

  Ministry_Week_ID: number /* 32-bit integer */; // Primary Key

  Fiscal_Period_ID: number /* 32-bit integer */; // Foreign Key -> Fiscal_Periods.Fiscal_Period_ID

  Ministry_Week_Start: string /* ISO datetime */;

  _Ministry_Week_End?: string /* ISO datetime */ | null; // Read Only, Computed

  Ministry_Week_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Ministry_Week_Types.Ministry_Week_Type_ID

  /**
   * Max length: 500 characters
   */
  Ministry_Week_Notes?: string /* max 500 chars */ | null;

  Days_in_Week?: number /* 32-bit integer */ | null; // Has Default

  Recompile_Answers: boolean; // Has Default
}

export type MinistryWeeksRecord = MinistryWeeks;
