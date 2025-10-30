/**
 * Interface for Location_Categories
* Table: Location_Categories
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface LocationCategories {

  Location_Category_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Location_Category: string /* max 100 chars */;
}

export type LocationCategoriesRecord = LocationCategories;
