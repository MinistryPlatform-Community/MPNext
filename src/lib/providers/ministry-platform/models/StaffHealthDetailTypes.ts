/**
 * Interface for Staff_Health_Detail_Types
* Table: Staff_Health_Detail_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StaffHealthDetailTypes {

  Health_Detail_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Health_Detail_Type: string /* max 50 chars */;

  HRA_OOP_Eligible: boolean; // Has Default

  Evaluation_Order: number /* 32-bit integer */;

  /**
   * Max length: 500 characters
   */
  Health_Detail_Evaluation_Rule?: string /* max 500 chars */ | null;

  Reimbursement_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Staff_Health_Reimbursement_Types.Reimbursement_Type_ID
}

export type StaffHealthDetailTypesRecord = StaffHealthDetailTypes;
