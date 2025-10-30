/**
 * Interface for dp_User_Charts
* Table: dp_User_Charts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpUserCharts {

  User_Chart_ID: number /* 32-bit integer */; // Primary Key

  Chart_ID: number /* 32-bit integer */; // Foreign Key -> dp_Charts.Chart_ID

  User_ID: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Chart_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Chart_Types.Chart_Type_ID

  Position: number /* 32-bit integer */; // Has Default
}

export type DpUserChartsRecord = DpUserCharts;
