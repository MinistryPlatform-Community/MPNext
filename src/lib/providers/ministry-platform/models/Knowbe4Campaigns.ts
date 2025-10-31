/**
 * Interface for KnowBe4_Campaigns
* Table: KnowBe4_Campaigns
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface Knowbe4Campaigns {

  KnowBe4_Campaign_ID: number /* 32-bit integer */; // Primary Key

  KnowBe4_Training_Campaign_ID: number /* 32-bit integer */;

  KnowBe4_Phishing_Campaign_ID: number /* 32-bit integer */;

  /**
   * Max length: 100 characters
   */
  Campaign_Name: string /* max 100 chars */;

  /**
   * Max length: 1000 characters
   */
  Description?: string /* max 1000 chars */ | null;

  Start_Date: string /* ISO date (YYYY-MM-DD) */;

  End_Date?: string /* ISO date (YYYY-MM-DD) */ | null;
}

export type Knowbe4CampaignsRecord = Knowbe4Campaigns;
