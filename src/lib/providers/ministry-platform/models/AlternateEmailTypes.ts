/**
 * Interface for Alternate_Email_Types
* Table: Alternate_Email_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AlternateEmailTypes {

  Alternate_Email_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Display_Name: string /* max 100 chars */;
}

export type AlternateEmailTypesRecord = AlternateEmailTypes;
