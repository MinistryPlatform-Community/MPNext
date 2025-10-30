/**
 * Interface for Schedule_Statuses
* Table: Schedule_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ScheduleStatuses {

  Schedule_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Schedule_Status: string /* max 50 chars */;
}

export type ScheduleStatusesRecord = ScheduleStatuses;
