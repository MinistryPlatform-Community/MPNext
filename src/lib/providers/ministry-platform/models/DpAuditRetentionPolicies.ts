/**
 * Interface for dp_Audit_Retention_Policies
* Table: dp_Audit_Retention_Policies
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpAuditRetentionPolicies {

  Audit_Retention_Policy_ID: number /* 32-bit integer */; // Primary Key

  Retention_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Audit_Retention_Types.Audit_Retention_Type_ID

  Table_Name?: unknown | null;

  Audit_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Audit_Types.Audit_Type_ID

  Audit_Retention_Days: number /* 32-bit integer */;

  Is_Active: boolean; // Has Default

  Detail_Retention_Days?: number /* 32-bit integer */ | null;
}

export type DpAuditRetentionPoliciesRecord = DpAuditRetentionPolicies;
