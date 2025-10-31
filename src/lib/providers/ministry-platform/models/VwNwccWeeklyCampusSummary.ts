/**
 * Interface for vw_nwcc_weekly_campus_summary
* Table: vw_nwcc_weekly_campus_summary
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwNwccWeeklyCampusSummary {

  Fake_ID?: number /* 64-bit integer */ | null; // Primary Key

  Weekend?: string /* ISO datetime */ | null;

  /**
   * Max length: 50 characters
   */
  Congregation_Name: string /* max 50 chars */;

  General_Fund_Plate?: number /* currency amount */ | null;

  General_Fund_Online?: number /* currency amount */ | null;

  Designated_Plate?: number /* currency amount */ | null;

  Designated_Online?: number /* currency amount */ | null;

  Adults_6_PM: number /* decimal */;

  Adults_9_AM: number /* decimal */;

  Adults_11_AM: number /* decimal */;

  Children_6_PM: number /* decimal */;

  Children_9_AM: number /* decimal */;

  Children_11_AM: number /* decimal */;

  NextGen_Vol_6_PM: number /* decimal */;

  NextGen_Vol_9_AM: number /* decimal */;

  NextGen_Vol_11_AM: number /* decimal */;

  REPLAY: number /* decimal */;

  Congregation_ID: number /* 32-bit integer */;
}

export type VwNwccWeeklyCampusSummaryRecord = VwNwccWeeklyCampusSummary;
