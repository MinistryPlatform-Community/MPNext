/**
 * Interface for Audience_Filters
* Table: Audience_Filters
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AudienceFilters {

  Filter_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Filter_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  Criteria: string /* max 1000 chars */;

  /**
   * Max length: 256 characters
   */
  Contact_ID_Field: string /* max 256 chars */;

  Table_Name: unknown;
}

export type AudienceFiltersRecord = AudienceFilters;
