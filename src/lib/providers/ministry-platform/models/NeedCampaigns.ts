/**
 * Interface for Need_Campaigns
* Table: Need_Campaigns
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface NeedCampaigns {

  Need_Campaign_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Campaign_Title: string /* max 50 chars */;

  Campaign_Guid: string /* GUID/UUID */; // Has Default

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;

  Is_Default: boolean; // Has Default

  Expected_Days_to_Complete: number /* 16-bit integer */; // Has Default

  Allow_Other_Need_Types: boolean; // Has Default
}

export type NeedCampaignsRecord = NeedCampaigns;
