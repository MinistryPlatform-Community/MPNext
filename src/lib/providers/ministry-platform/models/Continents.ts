/**
 * Interface for Continents
* Table: Continents
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Continents {

  Continent_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 25 characters
   */
  Continent: string /* max 25 chars */;
}

export type ContinentsRecord = Continents;
