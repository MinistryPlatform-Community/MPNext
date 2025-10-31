/**
 * Interface for Pocket_Platform_Categories
* Table: Pocket_Platform_Categories
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach
 * Generated from column metadata
 */
export interface PocketPlatformCategories {

  Category_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Category_Name: string /* max 100 chars */;

  Position?: number /* 32-bit integer */ | null;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;
}

export type PocketPlatformCategoriesRecord = PocketPlatformCategories;
