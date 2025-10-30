/**
 * Interface for Event_Metrics
* Table: Event_Metrics
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EventMetrics {

  Event_Metric_ID: number /* 32-bit integer */; // Primary Key

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Metric_ID: number /* 32-bit integer */; // Foreign Key -> Metrics.Metric_ID

  Numerical_Value: number /* decimal */;

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID
}

export type EventMetricsRecord = EventMetrics;
