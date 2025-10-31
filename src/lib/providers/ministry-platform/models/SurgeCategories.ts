/**
 * Interface for Surge_Categories
* Table: Surge_Categories
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface SurgeCategories {

  Surge_Category_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Surge_Category: string /* max 50 chars */;
}

export type SurgeCategoriesRecord = SurgeCategories;
