/**
 * Interface for _SurgeChurches
* Table: _SurgeChurches
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Surgechurches {

  /**
   * Max length: 255 characters
   */
  Program?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  "Church Plant Pastor"?: string /* max 255 chars */ | null;

  "Church Plant Date"?: string /* ISO datetime */ | null;

  "Church Plant Donation Amount"?: number /* decimal */ | null;

  /**
   * Max length: 255 characters
   */
  "City or Village"?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Country?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Continent?: string /* max 255 chars */ | null;

  "Check Sent to Surge"?: number /* decimal */ | null;

  "Certificate Received from Surge"?: number /* decimal */ | null;

  "Certificate Sent to Donor"?: number /* decimal */ | null;

  "Placard Number"?: number /* decimal */ | null;
}

export type SurgechurchesRecord = Surgechurches;
