/**
 * Interface for vw_gcc_covid_call_summary
* Table: vw_gcc_covid_call_summary
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwGccCovidCallSummary {

  User_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Made_By?: string /* max 75 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Planned_Contact_Title: string /* max 50 chars */;

  Calls?: number /* 32-bit integer */ | null;

  Successful?: number /* 32-bit integer */ | null;

  Not_Successful?: number /* 32-bit integer */ | null;

  Not_Yet_Made?: number /* 32-bit integer */ | null;
}

export type VwGccCovidCallSummaryRecord = VwGccCovidCallSummary;
