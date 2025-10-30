/**
 * Interface for Sponsor_Types
* Table: Sponsor_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface SponsorTypes {

  Sponsor_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 25 characters
   */
  Sponsor_Type: string /* max 25 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type SponsorTypesRecord = SponsorTypes;
