/**
 * Interface for vw_gcc_covid_calls
* Table: vw_gcc_covid_calls
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwGccCovidCalls {

  Contact_Log_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Made_By?: string /* max 75 chars */ | null;

  /**
   * Max length: 125 characters
   */
  Contacted_Person?: string /* max 125 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Planned_Contact_Title: string /* max 50 chars */;

  Planned_Contact_ID: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Contact_Log_Type: string /* max 50 chars */;

  Contact_Date: string /* ISO datetime */;

  Contact_Successful?: boolean | null;

  /**
   * Max length: 14 characters
   */
  Contact_Result: string /* max 14 chars */;

  /**
   * Max length: 2000 characters
   */
  Notes: string /* max 2000 chars */;

  Original_Contact_Log_Entry?: number /* 32-bit integer */ | null;

  Contact_ID: number /* 32-bit integer */;

  Congregation_ID: number /* 32-bit integer */;

  User_ID: number /* 32-bit integer */;
}

export type VwGccCovidCallsRecord = VwGccCovidCalls;
