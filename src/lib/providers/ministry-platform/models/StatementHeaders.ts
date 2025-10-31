/**
 * Interface for Statement_Headers
* Table: Statement_Headers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface StatementHeaders {

  Statement_Header_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Statement_Header: string /* max 50 chars */;

  Header_Sort: unknown;

  Publication_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Publications.Publication_ID
}

export type StatementHeadersRecord = StatementHeaders;
