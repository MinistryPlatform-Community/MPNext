/**
 * Interface for Personnel_Comment_Types
* Table: Personnel_Comment_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelCommentTypes {

  Personnel_Comment_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Personnel_Comment_Type: string /* max 50 chars */;
}

export type PersonnelCommentTypesRecord = PersonnelCommentTypes;
