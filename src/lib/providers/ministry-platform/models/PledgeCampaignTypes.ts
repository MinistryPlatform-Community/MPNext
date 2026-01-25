/**
 * Interface for Pledge_Campaign_Types
* Table: Pledge_Campaign_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PledgeCampaignTypes {

  Pledge_Campaign_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Campaign_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type PledgeCampaignTypesRecord = PledgeCampaignTypes;
