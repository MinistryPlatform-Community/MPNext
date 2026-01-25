/**
 * Interface for Sacrament_Sponsors
* Table: Sacrament_Sponsors
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface SacramentSponsors {

  Sacrament_Sponsor_ID: number /* 32-bit integer */; // Primary Key

  Sacrament_ID: number /* 32-bit integer */; // Foreign Key -> Sacraments.Sacrament_ID

  Sponsor_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 50 characters
   */
  Sponsor_Name?: string /* max 50 chars */ | null;

  Print_Order?: number /* 32-bit integer */ | null;

  Sponsor_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Sponsor_Types.Sponsor_Type_ID
}

export type SacramentSponsorsRecord = SacramentSponsors;
