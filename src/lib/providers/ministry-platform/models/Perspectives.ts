/**
 * Interface for Perspectives
* Table: Perspectives
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Perspectives {

  Perspective_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Perspective: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type PerspectivesRecord = Perspectives;
