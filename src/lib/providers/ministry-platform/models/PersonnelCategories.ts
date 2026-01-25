/**
 * Interface for Personnel_Categories
* Table: Personnel_Categories
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PersonnelCategories {

  Personnel_Category_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Personnel_Category: string /* max 50 chars */;
}

export type PersonnelCategoriesRecord = PersonnelCategories;
