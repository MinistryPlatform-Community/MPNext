/**
 * Interface for Care_Outcomes
* Table: Care_Outcomes
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface CareOutcomes {

  Care_Outcome_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Care_Outcome: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type CareOutcomesRecord = CareOutcomes;
