/**
 * Interface for Pocket_Platform_Sermon_Series_Types
* Table: Pocket_Platform_Sermon_Series_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach
 * Generated from column metadata
 */
export interface PocketPlatformSermonSeriesTypes {

  Sermon_Series_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Sermon_Series_Type: string /* max 50 chars */;

  Position?: number /* 32-bit integer */ | null;

  Web_Term_ID?: number /* 32-bit integer */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Enabled: boolean; // Has Default
}

export type PocketPlatformSermonSeriesTypesRecord = PocketPlatformSermonSeriesTypes;
