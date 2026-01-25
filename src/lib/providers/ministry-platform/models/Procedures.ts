/**
 * Interface for Procedures
* Table: Procedures
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Procedures {

  Procedure_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Procedure_Title: string /* max 50 chars */;

  Creation_Date?: string /* ISO datetime */ | null; // Has Default

  Active: boolean; // Has Default

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Ministry_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Ministries.Ministry_ID

  Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID

  /**
   * Max length: 1000 characters
   */
  Purpose?: string /* max 1000 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Approach?: string /* max 1000 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Step_by_Step?: string /* max 2147483647 chars */ | null;
}

export type ProceduresRecord = Procedures;
