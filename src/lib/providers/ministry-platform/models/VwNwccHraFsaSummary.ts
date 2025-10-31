/**
 * Interface for vw_nwcc_hra_fsa_summary
* Table: vw_nwcc_hra_fsa_summary
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface VwNwccHraFsaSummary {

  Staff_Annual_Benefits_ID: number /* 32-bit integer */; // Primary Key

  Staff_ID: number /* 32-bit integer */; // Foreign Key -> Staff.Staff_ID

  Benefit_Year_ID: number /* 32-bit integer */; // Foreign Key -> Benefit_Years.Benefit_Year_ID

  Starting_FSA?: number /* currency amount */ | null;

  FSA_Reimbursed: number /* currency amount */;

  FSA_Pending: number /* currency amount */;

  FSA_Remaining?: number /* currency amount */ | null;

  /**
   * Max length: 50 characters
   */
  Staff_Benefit_HRA?: string /* max 50 chars */ | null;

  Max_OOP: number /* currency amount */;

  Max_Nwoods: number /* currency amount */;

  Family_Member_Deductible: number /* currency amount */;

  Family_Member_Max_Nwoods?: number /* currency amount */ | null;

  HRA_Submitted: number /* currency amount */;

  Expenses_Denied: number /* currency amount */;

  HRA_Reimbursed: number /* currency amount */;

  HRA_Pending_Reimbursed: number /* currency amount */;

  HRA_Total_Reimbursed?: number /* currency amount */ | null;

  HRA_Not_Reimbursed: number /* currency amount */;

  HRA_Deductible_Eligible: number /* currency amount */;

  Plan_OOP_Remaining?: number /* currency amount */ | null;

  HRA_Plan_Remaining?: number /* currency amount */ | null;

  /**
   * Max length: 176 characters
   */
  Row_Name?: string /* max 176 chars */ | null;
}

export type VwNwccHraFsaSummaryRecord = VwNwccHraFsaSummary;
