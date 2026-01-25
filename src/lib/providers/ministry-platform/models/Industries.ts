/**
 * Interface for Industries
* Table: Industries
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Industries {

  Industry_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Industry_Title: string /* max 255 chars */;
}

export type IndustriesRecord = Industries;
