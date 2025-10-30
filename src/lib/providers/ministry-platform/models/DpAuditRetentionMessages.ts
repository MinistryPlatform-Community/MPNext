/**
 * Interface for dp_Audit_Retention_Messages
* Table: dp_Audit_Retention_Messages
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface DpAuditRetentionMessages {

  Audit_Retention_Message_ID: number /* 32-bit integer */; // Primary Key

  _Audit_Retention_Policy_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Audit_Retention_Policies.Audit_Retention_Policy_ID, Read Only

  _Message_Code?: number /* 32-bit integer */ | null; // Read Only

  _Message_Time?: string /* ISO datetime */ | null; // Read Only

  _Error_Severity?: number /* 32-bit integer */ | null; // Read Only

  /**
   * Max length: 2000 characters
   */
  _Message?: string /* max 2000 chars */ | null; // Read Only

  /**
   * Max length: 1000 characters
   */
  _Message_Sql?: string /* max 1000 chars */ | null; // Read Only
}

export type DpAuditRetentionMessagesRecord = DpAuditRetentionMessages;
