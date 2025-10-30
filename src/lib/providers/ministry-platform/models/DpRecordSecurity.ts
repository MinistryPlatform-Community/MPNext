/**
 * Interface for dp_Record_Security
* Table: dp_Record_Security
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpRecordSecurity {

  Record_Security_ID: number /* 32-bit integer */; // Primary Key

  Restricted: boolean;

  Record_ID: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Table_Name: string /* max 50 chars */;
}

export type DpRecordSecurityRecord = DpRecordSecurity;
