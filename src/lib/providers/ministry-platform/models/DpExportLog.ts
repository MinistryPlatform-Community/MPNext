/**
 * Interface for dp_Export_Log
* Table: dp_Export_Log
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpExportLog {

  Export_ID: number /* 32-bit integer */; // Primary Key

  Date_Time: string /* ISO datetime */;

  /**
   * Max length: 256 characters
   */
  User_Name?: string /* max 256 chars */ | null;

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Table_Name: unknown;

  /**
   * Max length: 255 characters
   */
  View_Title?: string /* max 255 chars */ | null;

  Record_Count: number /* 32-bit integer */;
}

export type DpExportLogRecord = DpExportLog;
