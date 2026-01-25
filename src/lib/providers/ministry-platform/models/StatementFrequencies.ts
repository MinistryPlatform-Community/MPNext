/**
 * Interface for Statement_Frequencies
* Table: Statement_Frequencies
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StatementFrequencies {

  Statement_Frequency_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Statement_Frequency: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type StatementFrequenciesRecord = StatementFrequencies;
