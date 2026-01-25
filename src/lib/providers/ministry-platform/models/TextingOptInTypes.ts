/**
 * Interface for Texting_Opt_In_Types
* Table: Texting_Opt_In_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface TextingOptInTypes {

  Texting_Opt_In_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Texting_Opt_In_Type: string /* max 100 chars */;

  /**
   * Max length: 100 characters
   */
  Texting_Opt_In_Label?: string /* max 100 chars */ | null;
}

export type TextingOptInTypesRecord = TextingOptInTypes;
