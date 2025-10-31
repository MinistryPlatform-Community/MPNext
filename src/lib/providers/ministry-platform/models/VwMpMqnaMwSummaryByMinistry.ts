/**
 * Interface for vw_mp_mqna_mw_summary_by_ministry
* Table: vw_mp_mqna_mw_summary_by_ministry
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwMpMqnaMwSummaryByMinistry {

  Period_Ministry_ID?: number /* 64-bit integer */ | null; // Primary Key

  /**
   * Max length: 4000 characters
   */
  Years_Since: string /* max 4000 chars */;

  Fiscal_Year_Start: string /* ISO datetime */;

  /**
   * Max length: 4000 characters
   */
  Periods_Since: string /* max 4000 chars */;

  Fiscal_Period_Start: string /* ISO datetime */;

  Fiscal_Period_Month?: number /* 32-bit integer */ | null;

  /**
   * Max length: 4000 characters
   */
  Weeks_Since: string /* max 4000 chars */;

  Ministry_Week_Start: string /* ISO datetime */;

  /**
   * Max length: 50 characters
   */
  Ministry_Week_Type: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Ministry_Name: string /* max 50 chars */;

  /**
   * Max length: 4000 characters
   */
  Adults_9am?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Adults_11am?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Children_9am?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Children_11am?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  NextGenVol_9am?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  NextGenVol_11am?: string /* max 4000 chars */ | null;

  Ministry_ID?: number /* 32-bit integer */ | null;
}

export type VwMpMqnaMwSummaryByMinistryRecord = VwMpMqnaMwSummaryByMinistry;
