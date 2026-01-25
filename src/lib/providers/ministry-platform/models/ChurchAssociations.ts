/**
 * Interface for Church_Associations
* Table: Church_Associations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ChurchAssociations {

  Church_Association_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Association_Name: string /* max 128 chars */;

  /**
   * Max length: 128 characters
   */
  Alt_Name?: string /* max 128 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  Address_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Website?: string /* URL */ | null;

  Year_Established?: number /* 32-bit integer */ | null;

  End_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Review_Date?: string /* ISO date (YYYY-MM-DD) */ | null;
}

export type ChurchAssociationsRecord = ChurchAssociations;
