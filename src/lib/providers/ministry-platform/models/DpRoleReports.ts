/**
 * Interface for dp_Role_Reports
* Table: dp_Role_Reports
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface DpRoleReports {

  Role_Report_ID: number /* 32-bit integer */; // Primary Key

  Role_ID: number /* 32-bit integer */; // Foreign Key -> dp_Roles.Role_ID

  Report_ID: number /* 32-bit integer */; // Foreign Key -> dp_Reports.Report_ID
}

export type DpRoleReportsRecord = DpRoleReports;
