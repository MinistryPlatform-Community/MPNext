/**
 * Interface for _WeeklyStats2017$
* Table: _WeeklyStats2017$
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Weeklystats2017 {

  "Event Start Date"?: string /* ISO datetime */ | null;

  /**
   * Max length: 255 characters
   */
  "Event Title"?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Congregation?: string /* max 255 chars */ | null;

  HeadCount?: number /* decimal */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null;

  Event_ID?: number /* 32-bit integer */ | null;
}

export type Weeklystats2017Record = Weeklystats2017;
