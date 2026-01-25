/**
 * Interface for Contribution_Statement_Donors
* Table: Contribution_Statement_Donors
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ContributionStatementDonors {

  Statement_Donor_ID: number /* 32-bit integer */; // Primary Key

  Statement_ID: number /* 32-bit integer */; // Foreign Key -> Contribution_Statements.Statement_ID

  Donor_ID: number /* 32-bit integer */; // Foreign Key -> Donors.Donor_ID
}

export type ContributionStatementDonorsRecord = ContributionStatementDonors;
