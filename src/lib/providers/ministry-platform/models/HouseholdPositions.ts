/**
 * Interface for Household_Positions
* Table: Household_Positions
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface HouseholdPositions {

  Household_Position_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 25 characters
   */
  Household_Position: string /* max 25 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type HouseholdPositionsRecord = HouseholdPositions;
