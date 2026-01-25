/**
 * Interface for Program_Types
* Table: Program_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ProgramTypes {

  Program_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Program_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type ProgramTypesRecord = ProgramTypes;
