/**
 * Interface for Staff_Health_Expense_Statuses
* Table: Staff_Health_Expense_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StaffHealthExpenseStatuses {

  Expense_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Expense_Status: string /* max 50 chars */;
}

export type StaffHealthExpenseStatusesRecord = StaffHealthExpenseStatuses;
