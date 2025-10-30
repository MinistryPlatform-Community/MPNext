/**
 * Interface for Addresses
* Table: Addresses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Addresses {

  Address_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Address_Line_1: string /* max 75 chars */;

  /**
   * Max length: 75 characters
   */
  Address_Line_2?: string /* max 75 chars */ | null;

  /**
   * Max length: 50 characters
   */
  City?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  "State/Region"?: string /* max 50 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Postal_Code?: string /* max 15 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Foreign_Country?: string /* max 255 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Country_Code?: string /* max 25 chars */ | null;

  /**
   * Max length: 10 characters
   */
  Carrier_Route?: string /* max 10 chars */ | null;

  /**
   * Max length: 10 characters
   */
  Lot_Number?: string /* max 10 chars */ | null;

  /**
   * Max length: 3 characters
   */
  Delivery_Point_Code?: string /* max 3 chars */ | null;

  Delivery_Point_Check_Digit?: unknown | null;

  /**
   * Max length: 15 characters
   */
  Latitude?: string /* max 15 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Longitude?: string /* max 15 chars */ | null;

  /**
   * Max length: 15 characters
   */
  Altitude?: string /* max 15 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Time_Zone?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Bar_Code?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Area_Code?: string /* max 50 chars */ | null;

  Last_Validation_Attempt?: string /* ISO datetime */ | null;

  /**
   * Max length: 50 characters
   */
  County?: string /* max 50 chars */ | null;

  Validated?: boolean | null;

  Do_Not_Validate: boolean; // Has Default

  Last_GeoCode_Attempt?: string /* ISO datetime */ | null;

  /**
   * Max length: 100 characters
   */
  Country?: string /* max 100 chars */ | null;
}

export type AddressesRecord = Addresses;
