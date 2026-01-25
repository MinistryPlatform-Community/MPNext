/**
 * Interface for Pledge_Campaigns
* Table: Pledge_Campaigns
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PledgeCampaigns {

  Pledge_Campaign_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Campaign_Name: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  Pledge_Campaign_Type_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Campaign_Types.Pledge_Campaign_Type_ID

  /**
   * Max length: 500 characters
   */
  Description?: string /* max 500 chars */ | null;

  Campaign_Goal: number /* currency amount */;

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Program_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID

  Registration_Start?: string /* ISO datetime */ | null;

  Registration_End?: string /* ISO datetime */ | null;

  Maximum_Registrants?: number /* 32-bit integer */ | null;

  Registration_Deposit?: number /* currency amount */ | null;

  Fundraising_Goal?: number /* currency amount */ | null;

  Registration_Form?: number /* 32-bit integer */ | null; // Foreign Key -> Forms.Form_ID

  Allow_Online_Pledge: boolean; // Has Default

  /**
   * Max length: 255 characters
   */
  Online_Thank_You_Message?: string /* max 255 chars */ | null;

  Pledge_Beyond_End_Date: boolean; // Has Default

  Show_On_My_Pledges: boolean; // Has Default

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Credit_Parishes: boolean; // Has Default

  Auto_Create_Pledge: boolean; // Has Default

  Auto_Increase_Total: boolean; // Has Default
}

export type PledgeCampaignsRecord = PledgeCampaigns;
