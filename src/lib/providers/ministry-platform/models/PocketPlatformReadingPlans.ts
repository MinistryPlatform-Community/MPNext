/**
 * Interface for Pocket_Platform_Reading_Plans
* Table: Pocket_Platform_Reading_Plans
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformReadingPlans {

  Reading_Plan_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Reading_Plan: string /* max 50 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type PocketPlatformReadingPlansRecord = PocketPlatformReadingPlans;
