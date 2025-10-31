/**
 * Interface for Staff_Health_Reimbursement_Types
* Table: Staff_Health_Reimbursement_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StaffHealthReimbursementTypes {

  Reimbursement_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Reimbursement_Type: string /* max 50 chars */;

  ACS_GL_Account?: number /* 32-bit integer */ | null;

  ACS_Checking_Account?: number /* 32-bit integer */ | null; // Has Default
}

export type StaffHealthReimbursementTypesRecord = StaffHealthReimbursementTypes;
