/**
 * Interface for Audience_Audience_Filters
* Table: Audience_Audience_Filters
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AudienceAudienceFilters {

  Audience_Audience_Filter_ID: number /* 32-bit integer */; // Primary Key

  Audience_ID: number /* 32-bit integer */; // Foreign Key -> Audiences.Audience_ID

  Filter_ID: number /* 32-bit integer */; // Foreign Key -> Audience_Filters.Filter_ID

  Operator_ID: number /* 32-bit integer */; // Foreign Key -> Audience_Operators.Operator_ID

  /**
   * Max length: 64 characters
   */
  Filter_Parameter?: string /* max 64 chars */ | null;
}

export type AudienceAudienceFiltersRecord = AudienceAudienceFilters;
