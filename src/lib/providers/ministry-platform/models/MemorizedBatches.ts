/**
 * Interface for Memorized_Batches
* Table: Memorized_Batches
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MemorizedBatches {

  Memorized_Batch_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Memorized_Batch_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 25 characters
   */
  Currency?: string /* max 25 chars */ | null; // Has Default
}

export type MemorizedBatchesRecord = MemorizedBatches;
