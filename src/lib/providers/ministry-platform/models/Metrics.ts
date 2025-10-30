/**
 * Interface for Metrics
* Table: Metrics
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Metrics {

  Metric_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Metric_Title: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;
}

export type MetricsRecord = Metrics;
