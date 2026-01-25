/**
 * Interface for Pledge_Frequencies
* Table: Pledge_Frequencies
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PledgeFrequencies {

  Pledge_Frequency_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Pledge_Frequency: string /* max 128 chars */;
}

export type PledgeFrequenciesRecord = PledgeFrequencies;
