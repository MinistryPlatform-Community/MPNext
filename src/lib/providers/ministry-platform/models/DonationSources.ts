/**
 * Interface for Donation_Sources
* Table: Donation_Sources
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DonationSources {

  Donation_Source_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Donation_Source: string /* max 128 chars */;

  /**
   * Max length: 24 characters
   */
  Code?: string /* max 24 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  Campaign_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Active: boolean; // Has Default
}

export type DonationSourcesRecord = DonationSources;
