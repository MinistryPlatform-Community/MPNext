/**
 * Interface for Campaign_Goals
* Table: Campaign_Goals
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CampaignGoals {

  Campaign_Goal_ID: number /* 32-bit integer */; // Primary Key

  Campaign_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Goal_Amount: number /* currency amount */; // Has Default

  Share_Percent_Up_to_Goal?: number /* decimal */ | null;

  Share_Percent_Over_Goal?: number /* decimal */ | null;
}

export type CampaignGoalsRecord = CampaignGoals;
