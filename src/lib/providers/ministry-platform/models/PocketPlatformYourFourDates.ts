/**
 * Interface for Pocket_Platform_Your_Four_Dates
* Table: Pocket_Platform_Your_Four_Dates
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformYourFourDates {

  Your_Four_Date_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Reminder_Text?: string /* max 50 chars */ | null;

  Date: string /* ISO date (YYYY-MM-DD) */;

  Day: unknown;

  /**
   * Max length: 2 characters
   */
  DaySuffix: string /* max 2 chars */;

  Weekday: unknown;

  /**
   * Max length: 10 characters
   */
  WeekDayName: string /* max 10 chars */;

  IsWeekend: boolean;

  DOWInMonth: unknown;

  DayOfYear: number /* 16-bit integer */;

  WeekOfMonth: unknown;

  WeekOfYear: unknown;

  Month: unknown;

  /**
   * Max length: 10 characters
   */
  MonthName: string /* max 10 chars */;

  Year: number /* 32-bit integer */;

  /**
   * Max length: 6 characters
   */
  MMYYYY: string /* max 6 chars */;

  /**
   * Max length: 7 characters
   */
  MonthYear: string /* max 7 chars */;
}

export type PocketPlatformYourFourDatesRecord = PocketPlatformYourFourDates;
