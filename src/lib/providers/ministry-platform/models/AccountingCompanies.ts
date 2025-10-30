/**
 * Interface for Accounting_Companies
* Table: Accounting_Companies
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface AccountingCompanies {

  Accounting_Company_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Company_Name: string /* max 75 chars */;

  Company_Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Default_Congregation?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Show_Online: boolean; // Has Default

  Online_Sort_Order?: number /* 16-bit integer */ | null;

  Pledge_Campaign_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Alternate_Pledge_Campaign?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  List_Non_Cash_Gifts: boolean; // Has Default

  /**
   * Max length: 500 characters
   */
  Statement_Footer?: string /* max 500 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Statement_Letter?: string /* max 2147483647 chars */ | null;

  Statement_Cutoff_Date?: string /* ISO datetime */ | null;

  Statement_Cutoff_Automation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Statement_Cutoff_Automation.Statement_Cutoff_Automation_ID, Has Default

  Standard_Statement?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Reports.Report_ID

  Formal_Salutation: boolean; // Has Default

  Archive_Day_of_Year: number /* 32-bit integer */; // Has Default

  Rows_Per_Page: number /* 32-bit integer */; // Has Default

  Summary_Columns: number /* 32-bit integer */; // Has Default

  /**
   * Max length: 10 characters
   */
  Immediate_Destination_ID?: string /* max 10 chars */ | null;

  /**
   * Max length: 10 characters
   */
  Immediate_Origin_ID?: string /* max 10 chars */ | null;

  /**
   * Max length: 23 characters
   */
  Immediate_Destination_Name?: string /* max 23 chars */ | null;

  /**
   * Max length: 23 characters
   */
  Immediate_Origin_Name?: string /* max 23 chars */ | null;

  /**
   * Max length: 9 characters
   */
  Immediate_Routing_Number?: string /* max 9 chars */ | null;

  /**
   * Max length: 9 characters
   */
  Receiving_DFI_ID?: string /* max 9 chars */ | null;

  Current_Settings: boolean;

  Include_Soft_Credits: boolean; // Has Default
}

export type AccountingCompaniesRecord = AccountingCompanies;
