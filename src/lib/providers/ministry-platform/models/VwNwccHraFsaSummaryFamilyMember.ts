/**
 * Interface for vw_nwcc_hra_fsa_summary_family_member
* Table: vw_nwcc_hra_fsa_summary_family_member
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwNwccHraFsaSummaryFamilyMember {

  Read_Only_PK?: number /* 64-bit integer */ | null; // Primary Key

  Staff_Annual_Benefits_ID: number /* 32-bit integer */; // Foreign Key -> Staff_Annual_Benefits.Staff_Annual_Benefits_ID

  Individual: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Individual_Submitted: number /* currency amount */;

  HRA_Qualified?: boolean | null;

  /**
   * Max length: 25 characters
   */
  Household_Position?: string /* max 25 chars */ | null;

  Employee_Only_Plan?: boolean | null;

  Is_Employee?: boolean | null;

  Individual_HRA_Submitted: number /* currency amount */;

  Individual_Deductible_Eligible?: number /* currency amount */ | null;

  Individual_Deductible: number /* currency amount */;

  Individual_Deductible_Remaining?: number /* currency amount */ | null;

  OOP_Needed?: number /* currency amount */ | null;

  Individual_HRA_Reimbursed: number /* currency amount */;

  Reimbursement_Possible?: number /* currency amount */ | null;

  Individual_FSA_Reimbursed: number /* currency amount */;
}

export type VwNwccHraFsaSummaryFamilyMemberRecord = VwNwccHraFsaSummaryFamilyMember;
