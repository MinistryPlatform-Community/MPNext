/**
 * Interface for Genders
* Table: Genders
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Genders {

  Gender_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 25 characters
   */
  Gender: string /* max 25 chars */;
}

export type GendersRecord = Genders;
