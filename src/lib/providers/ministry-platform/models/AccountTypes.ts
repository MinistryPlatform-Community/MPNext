/**
 * Interface for Account_Types
* Table: Account_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AccountTypes {

  Account_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Account_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type AccountTypesRecord = AccountTypes;
