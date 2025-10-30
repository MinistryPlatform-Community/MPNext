/**
 * Interface for Statement_Methods
* Table: Statement_Methods
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StatementMethods {

  Statement_Method_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Statement_Method: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type StatementMethodsRecord = StatementMethods;
