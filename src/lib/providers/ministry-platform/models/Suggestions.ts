/**
 * Interface for Suggestions
* Table: Suggestions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Suggestions {

  Suggestion_ID: number /* 32-bit integer */; // Primary Key

  Suggested_By: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Date_Suggested: string /* ISO datetime */;

  Suggestion_Type_ID: number /* 32-bit integer */; // Foreign Key -> Suggestion_Types.Suggestion_Type_ID

  /**
   * Max length: 1000 characters
   */
  Description: string /* max 1000 chars */; // Has Default

  /**
   * Max length: 1000 characters
   */
  IS_Team_Response?: string /* max 1000 chars */ | null;

  _Completed?: boolean | null; // Read Only
}

export type SuggestionsRecord = Suggestions;
