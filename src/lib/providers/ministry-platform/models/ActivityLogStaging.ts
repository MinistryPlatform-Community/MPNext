/**
 * Interface for Activity_Log_Staging
* Table: Activity_Log_Staging
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ActivityLogStaging {

  Activity_Log_Staging_ID: number /* 32-bit integer */; // Primary Key

  Page_ID: number /* 32-bit integer */;

  Last_PK: number /* 32-bit integer */;

  Last_Date: string /* ISO datetime */;
}

export type ActivityLogStagingRecord = ActivityLogStaging;
