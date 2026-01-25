/**
 * Interface for Time_Off_Types
* Table: Time_Off_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface TimeOffTypes {

  Time_Off_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Time_Off_Type: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;
}

export type TimeOffTypesRecord = TimeOffTypes;
