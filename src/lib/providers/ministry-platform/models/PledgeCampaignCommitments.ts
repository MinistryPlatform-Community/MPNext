/**
 * Interface for Pledge_Campaign_Commitments
* Table: Pledge_Campaign_Commitments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PledgeCampaignCommitments {

  Commitment_ID: number /* 32-bit integer */; // Primary Key

  Pledge_Campaign_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Commitment_Date: string /* ISO datetime */;

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Phone?: string /* max 50 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Email_Address?: string /* max 254 chars */ | null;

  Birthday?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_First?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Last?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Spouse_Phone?: string /* max 50 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Spouse_Email_Address?: string /* max 254 chars */ | null;

  Spouse_Birthday?: string /* ISO date (YYYY-MM-DD) */ | null;

  Contact_Me: boolean; // Has Default

  Previous_Annual_Giving: number /* currency amount */; // Has Default

  Expanded_Annual_Giving: number /* currency amount */; // Has Default

  Two_Year_Commitment?: number /* currency amount */ | null;

  Kickoff_Giving: number /* currency amount */; // Has Default

  Step_Fearless: boolean; // Has Default

  Step_Above_and_Beyond: boolean; // Has Default

  Step_Tithing: boolean; // Has Default

  Step_Percentage: boolean; // Has Default

  Step_Consistent: boolean; // Has Default

  Include_Spouse_Giving: boolean; // Has Default

  Pledge_Status_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Statuses.Pledge_Status_ID, Has Default

  Pledge_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledges.Pledge_ID
}

export type PledgeCampaignCommitmentsRecord = PledgeCampaignCommitments;
