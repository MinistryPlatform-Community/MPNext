/**
 * Interface for Pocket_Platform_Reading_Plan_Days
* Table: Pocket_Platform_Reading_Plan_Days
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformReadingPlanDays {

  Reading_Plan_Day_ID: number /* 32-bit integer */; // Primary Key

  Reading_Plan_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Reading_Plans.Reading_Plan_ID

  /**
   * Max length: 50 characters
   */
  Reading_Plan_Day?: string /* max 50 chars */ | null;

  Date: string /* ISO date (YYYY-MM-DD) */;

  /**
   * Max length: 500 characters
   */
  Passages: string /* max 500 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type PocketPlatformReadingPlanDaysRecord = PocketPlatformReadingPlanDays;
