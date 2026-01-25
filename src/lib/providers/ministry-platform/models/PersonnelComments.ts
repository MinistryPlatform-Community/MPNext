/**
 * Interface for Personnel_Comments
* Table: Personnel_Comments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelComments {

  Personnel_Comment_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  Comment_Date: string /* ISO datetime */; // Has Default

  Personnel_Comment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Personnel_Comment_Types.Personnel_Comment_Type_ID

  /**
   * Max length: 2000 characters
   */
  Comment: string /* max 2000 chars */;
}

export type PersonnelCommentsRecord = PersonnelComments;
