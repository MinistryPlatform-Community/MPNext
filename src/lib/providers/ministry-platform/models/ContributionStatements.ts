/**
 * Interface for Contribution_Statements
* Table: Contribution_Statements
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ContributionStatements {

  Statement_ID: number /* 32-bit integer */; // Primary Key

  Accounting_Company_ID: number /* 32-bit integer */; // Foreign Key -> Accounting_Companies.Accounting_Company_ID

  Statement_Year: number /* 32-bit integer */;

  Household_ID: number /* 32-bit integer */; // Foreign Key -> Households.Household_ID

  Statement_Type_ID: number /* 32-bit integer */; // Foreign Key -> Statement_Types.Statement_Type_ID

  Contact_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Spouse_Record?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 254 characters
   */
  Salutation?: string /* max 254 chars */ | null;

  Archived: boolean; // Has Default

  Archived_Campaign?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Alternate_Archived_Campaign?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Last_Change_By_Routine: string /* ISO datetime */; // Has Default

  Last_Statement_File?: string /* ISO datetime */ | null;
}

export type ContributionStatementsRecord = ContributionStatements;
