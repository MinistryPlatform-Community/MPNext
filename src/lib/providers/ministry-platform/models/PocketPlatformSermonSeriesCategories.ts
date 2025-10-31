/**
 * Interface for Pocket_Platform_Sermon_Series_Categories
* Table: Pocket_Platform_Sermon_Series_Categories
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformSermonSeriesCategories {

  Sermon_Series_Category_ID: number /* 32-bit integer */; // Primary Key

  Series_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Sermon_Series.Sermon_Series_ID

  Category_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Categories.Category_ID

  Start_Date: string /* ISO datetime */;

  Position?: number /* 32-bit integer */ | null;

  End_Date?: string /* ISO datetime */ | null;
}

export type PocketPlatformSermonSeriesCategoriesRecord = PocketPlatformSermonSeriesCategories;
