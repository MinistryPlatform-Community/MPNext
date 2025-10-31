/**
 * Interface for Event_Type_Metrics
* Table: Event_Type_Metrics
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface EventTypeMetrics {

  Event_Type_Metric_ID: number /* 32-bit integer */; // Primary Key

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Metric_ID: number /* 32-bit integer */; // Foreign Key -> Metrics.Metric_ID

  Event_Type_ID: number /* 32-bit integer */; // Foreign Key -> Event_Types.Event_Type_ID

  Max_Value?: number /* 32-bit integer */ | null;
}

export type EventTypeMetricsRecord = EventTypeMetrics;
