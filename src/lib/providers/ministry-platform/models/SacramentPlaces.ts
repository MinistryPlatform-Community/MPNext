/**
 * Interface for Sacrament_Places
* Table: Sacrament_Places
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface SacramentPlaces {

  Sacrament_Place_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Place_Name: string /* max 128 chars */;

  /**
   * Max length: 1000 characters
   */
  Description?: string /* max 1000 chars */ | null;

  Address_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Mailing_Address_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Phone?: string /* phone number */ | null;

  Alt_Phone?: string /* phone number */ | null;

  Fax?: string /* phone number */ | null;

  /**
   * Max length: 254 characters
   */
  Email?: string /* email, max 254 chars */ | null;

  Website?: string /* URL */ | null;

  Closed: boolean; // Has Default

  Church_Association_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Church_Associations.Church_Association_ID
}

export type SacramentPlacesRecord = SacramentPlaces;
