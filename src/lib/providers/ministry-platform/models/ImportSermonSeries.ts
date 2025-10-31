/**
 * Interface for import_Sermon_Series
* Table: import_Sermon_Series
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ImportSermonSeries {

  /**
   * Max length: 100 characters
   */
  Title?: string /* max 100 chars */ | null;

  /**
   * Max length: 1200 characters
   */
  Description?: string /* max 1200 chars */ | null;

  Start_Date?: string /* ISO datetime */ | null;

  WP_Category_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 150 characters
   */
  Graphic_URL?: string /* max 150 chars */ | null;

  Series_ID?: number /* 32-bit integer */ | null;
}

export type ImportSermonSeriesRecord = ImportSermonSeries;
