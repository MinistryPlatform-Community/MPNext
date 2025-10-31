/**
 * Interface for vw_mp_mqna_fy_summary_by_congregation
* Table: vw_mp_mqna_fy_summary_by_congregation
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwMpMqnaFySummaryByCongregation {

  Period_Congregation_ID?: number /* 64-bit integer */ | null; // Primary Key

  /**
   * Max length: 4000 characters
   */
  Years_Since: string /* max 4000 chars */;

  Fiscal_Year_Start: string /* ISO datetime */;

  /**
   * Max length: 50 characters
   */
  Congregation_Name: string /* max 50 chars */;

  /**
   * Max length: 4000 characters
   */
  ChurchPlant$?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Gen_Fund_Plate?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Gen_Fund_Online?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  DesignatedPlate?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  DesignateOnline?: string /* max 4000 chars */ | null;

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

  /**
   * Max length: 4000 characters
   */
  Replay?: string /* max 4000 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null;
}

export type VwMpMqnaFySummaryByCongregationRecord = VwMpMqnaFySummaryByCongregation;
