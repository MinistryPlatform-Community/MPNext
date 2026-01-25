/**
 * Interface for dp_Authentication_Log
* Table: dp_Authentication_Log
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpAuthenticationLog {

  Authentication_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 256 characters
   */
  User_Name: string /* max 256 chars */;

  /**
   * Max length: 75 characters
   */
  Server_Name: string /* max 75 chars */;

  /**
   * Max length: 50 characters
   */
  IP_Address: string /* max 50 chars */;

  Date_Time: string /* ISO datetime */; // Has Default

  User_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 2048 characters
   */
  Referrer?: string /* max 2048 chars */ | null;

  Keep_Signed_In: boolean; // Has Default

  Last_Token_Request?: string /* ISO datetime */ | null;
}

export type DpAuthenticationLogRecord = DpAuthenticationLog;
