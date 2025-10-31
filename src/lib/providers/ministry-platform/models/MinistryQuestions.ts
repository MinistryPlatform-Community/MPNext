/**
 * Interface for Ministry_Questions
* Table: Ministry_Questions
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface MinistryQuestions {

  Ministry_Question_ID: number /* 32-bit integer */; // Primary Key

  Accounting_Company_ID: number /* 32-bit integer */; // Foreign Key -> Accounting_Companies.Accounting_Company_ID

  Ministry_ID: number /* 32-bit integer */; // Foreign Key -> Ministries.Ministry_ID

  /**
   * Max length: 100 characters
   */
  Question_Title: string /* max 100 chars */;

  /**
   * Max length: 15 characters
   */
  Question_Header: string /* max 15 chars */;

  /**
   * Max length: 500 characters
   */
  Question_Description?: string /* max 500 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Planning_Notes?: string /* max 4000 chars */ | null;

  Discontinued: boolean; // Has Default

  /**
   * Max length: 4000 characters
   */
  Answer_SELECT?: string /* max 4000 chars */ | null;

  Automation_Active: boolean; // Has Default

  /**
   * Max length: 500 characters
   */
  _Deactive_Reason?: string /* max 500 chars */ | null; // Read Only

  /**
   * Max length: 2 characters
   */
  Answer_Format: string /* max 2 chars */; // Has Default

  Answer_Starts_After: string /* ISO datetime */; // Has Default

  Answer_Order: number /* 32-bit integer */; // Has Default

  Weeks_to_Update: number /* 32-bit integer */; // Has Default

  On_Congregation_Summary: boolean; // Has Default

  On_Ministry_Summary: boolean; // Has Default

  On_Program_Summary: boolean; // Has Default

  /**
   * Max length: 4 characters
   */
  Value_Aggregation: string /* max 4 chars */; // Has Default

  /**
   * Max length: 4 characters
   */
  Goal_Aggregation: string /* max 4 chars */; // Has Default

  Summary_Column_Sort: number /* 32-bit integer */; // Has Default
}

export type MinistryQuestionsRecord = MinistryQuestions;
