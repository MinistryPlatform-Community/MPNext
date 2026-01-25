/**
 * Interface for Prefixes
* Table: Prefixes
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Prefixes {

  Prefix_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Prefix: string /* max 50 chars */;
}

export type PrefixesRecord = Prefixes;
