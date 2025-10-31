/**
 * Interface for Prayer_Outcomes
* Table: Prayer_Outcomes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PrayerOutcomes {

  Prayer_Outcome_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Prayer_Outcome: string /* max 50 chars */;
}

export type PrayerOutcomesRecord = PrayerOutcomes;
