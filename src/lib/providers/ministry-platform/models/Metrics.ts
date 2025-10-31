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
   * Max length: 50 characters
   */
  Metric_Type?: string /* max 50 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;

  /**
   * Max length: 10 characters
   */
  PP_Platform?: string /* max 10 chars */ | null;

  Live_Multiplier: number /* decimal */; // Has Default

  Replay_Multiplier: number /* decimal */; // Has Default
}

export type MetricsRecord = Metrics;
