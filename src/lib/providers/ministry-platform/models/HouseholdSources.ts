/**
 * Interface for Household_Sources
* Table: Household_Sources
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface HouseholdSources {

  Household_Source_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Household_Source: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type HouseholdSourcesRecord = HouseholdSources;
