/**
 * Interface for KnowBe4_Campaign_Users
* Table: KnowBe4_Campaign_Users
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface Knowbe4CampaignUsers {

  KnowBe4_Campaign_User_ID: number /* 32-bit integer */; // Primary Key

  KnowBe4_User_ID: number /* 32-bit integer */; // Foreign Key -> KnowBe4_Users.KnowBe4_User_ID

  KnowBe4_Campaign_ID: number /* 32-bit integer */; // Foreign Key -> KnowBe4_Campaigns.KnowBe4_Campaign_ID

  KnowBe4_Team_ID: number /* 32-bit integer */; // Foreign Key -> KnowBe4_Teams.KnowBe4_Team_ID

  Enroll_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Training_Completion_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Training_Score?: number /* 32-bit integer */ | null;

  Bonus_Points?: number /* 32-bit integer */ | null;

  /**
   * Max length: 1000 characters
   */
  Bonus_Points_Note?: string /* max 1000 chars */ | null;

  First_PST_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  First_PST_Score?: number /* 32-bit integer */ | null;

  Second_PST_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Second_PST_Score?: number /* 32-bit integer */ | null;

  Third_PST_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Third_PST_Score?: number /* 32-bit integer */ | null;

  Fourth_PST_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  Fourth_PST_Score?: number /* 32-bit integer */ | null;
}

export type Knowbe4CampaignUsersRecord = Knowbe4CampaignUsers;
