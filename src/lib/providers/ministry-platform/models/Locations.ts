/**
 * Interface for Locations
* Table: Locations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Locations {

  Location_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Location_Name: string /* max 50 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Location_Type_ID: number /* 32-bit integer */; // Foreign Key -> Location_Types.Location_Type_ID

  Address_ID: number /* 32-bit integer */; // Foreign Key -> Addresses.Address_ID

  Move_In_Date?: string /* ISO datetime */ | null;

  Move_Out_Date?: string /* ISO datetime */ | null;

  Phone?: string /* phone number */ | null;

  Location_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Location_Groups.Location_Group_ID

  Mailing_Address_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Addresses.Address_ID

  Location_Category_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Location_Categories.Location_Category_ID
}

export type LocationsRecord = Locations;
