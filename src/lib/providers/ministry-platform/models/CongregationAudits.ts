/**
 * Interface for Congregation_Audits
* Table: Congregation_Audits
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface CongregationAudits {

  Congregation_Audit_ID: number /* 32-bit integer */; // Primary Key

  Household_ID: number /* 32-bit integer */; // Foreign Key -> Households.Household_ID

  Change_Date: string /* ISO datetime */;

  Prior_Congregation: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  New_Congregation: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 300 characters
   */
  Notes?: string /* max 300 chars */ | null;
}

export type CongregationAuditsRecord = CongregationAudits;
