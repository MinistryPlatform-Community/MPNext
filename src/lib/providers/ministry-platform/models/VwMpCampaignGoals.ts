/**
 * Interface for vw_mp_Campaign_Goals
* Table: vw_mp_Campaign_Goals
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwMpCampaignGoals {

  Campaign_Goal_ID: number /* 32-bit integer */; // Primary Key, Foreign Key -> Campaign_Goals.Campaign_Goal_ID

  Pledge_Campaign_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  /**
   * Max length: 50 characters
   */
  Campaign_Name: string /* max 50 chars */;

  Organization_ID: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Organization_Name: string /* max 50 chars */;

  Goal_Amount: number /* currency amount */;

  Pledge_Count: number /* 32-bit integer */;

  Original_Pledge: number /* currency amount */;

  Total_Received: number /* currency amount */;

  Adjustments: number /* currency amount */;

  Pledged?: number /* currency amount */ | null;
}

export type VwMpCampaignGoalsRecord = VwMpCampaignGoals;
