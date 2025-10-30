/**
 * Interface for Visibility_Levels
* Table: Visibility_Levels
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface VisibilityLevels {

  Visibility_Level_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Visibility_Level: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type VisibilityLevelsRecord = VisibilityLevels;
