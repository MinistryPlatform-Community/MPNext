/**
 * Interface for vw_mp_Personnel_Audit_Overview
* Table: vw_mp_Personnel_Audit_Overview
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwMpPersonnelAuditOverview {

  Audit_Item_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Table_Name: string /* max 75 chars */;

  Record_ID: number /* 32-bit integer */;

  Personnel_ID: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Description: string /* max 50 chars */;

  /**
   * Max length: 254 characters
   */
  User: string /* max 254 chars */;

  Date: string /* ISO datetime */;

  /**
   * Max length: 256 characters
   */
  On_Behalf_Of: string /* max 256 chars */;

  /**
   * Max length: 256 characters
   */
  Impersonated_By: string /* max 256 chars */;

  /**
   * Max length: 50 characters
   */
  Field?: string /* max 50 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Previous: string /* max 2147483647 chars */;

  /**
   * Max length: 2147483647 characters
   */
  New: string /* max 2147483647 chars */;
}

export type VwMpPersonnelAuditOverviewRecord = VwMpPersonnelAuditOverview;
