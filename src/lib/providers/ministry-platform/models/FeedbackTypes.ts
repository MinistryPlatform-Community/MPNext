/**
 * Interface for Feedback_Types
* Table: Feedback_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface FeedbackTypes {

  Feedback_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Feedback_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID
}

export type FeedbackTypesRecord = FeedbackTypes;
