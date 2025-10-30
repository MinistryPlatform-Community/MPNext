/**
 * Interface for Frequencies
* Table: Frequencies
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Frequencies {

  Frequency_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Frequency: string /* max 128 chars */;
}

export type FrequenciesRecord = Frequencies;
