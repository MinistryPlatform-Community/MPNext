/**
 * Interface for Statement_Cutoff_Automation
* Table: Statement_Cutoff_Automation
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StatementCutoffAutomation {

  Statement_Cutoff_Automation_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Automation_Type: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Automation_Description?: string /* max 500 chars */ | null;
}

export type StatementCutoffAutomationRecord = StatementCutoffAutomation;
