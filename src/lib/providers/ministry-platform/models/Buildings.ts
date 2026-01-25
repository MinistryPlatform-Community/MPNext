/**
 * Interface for Buildings
* Table: Buildings
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Buildings {

  Building_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Building_Name: string /* max 50 chars */;

  Location_ID: number /* 32-bit integer */; // Foreign Key -> Locations.Location_ID

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Next_Inspection_Date?: string /* ISO datetime */ | null;

  Building_Coordinator?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Date_Acquired?: string /* ISO datetime */ | null;

  Date_Constructed?: string /* ISO datetime */ | null;

  Date_Retired?: string /* ISO datetime */ | null;
}

export type BuildingsRecord = Buildings;
