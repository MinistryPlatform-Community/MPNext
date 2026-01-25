/**
 * Interface for Countries
* Table: Countries
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Countries {

  Country_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 255 characters
   */
  Country?: string /* max 255 chars */ | null;

  Continent_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Continents.Continent_ID

  /**
   * Max length: 2 characters
   */
  Country_Code?: string /* max 2 chars */ | null;

  /**
   * Max length: 2 characters
   */
  Code2?: string /* max 2 chars */ | null;

  /**
   * Max length: 3 characters
   */
  Code3?: string /* max 3 chars */ | null;

  /**
   * Max length: 32 characters
   */
  Calling_Code?: string /* max 32 chars */ | null;
}

export type CountriesRecord = Countries;
