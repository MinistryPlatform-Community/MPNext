/**
 * Interface for Suggestion_Types
* Table: Suggestion_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface SuggestionTypes {

  Suggestion_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Suggestion_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type SuggestionTypesRecord = SuggestionTypes;
