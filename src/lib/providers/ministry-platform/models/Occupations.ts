/**
 * Interface for Occupations
* Table: Occupations
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Occupations {

  Occupation_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Occupation_Title: string /* max 255 chars */;
}

export type OccupationsRecord = Occupations;
