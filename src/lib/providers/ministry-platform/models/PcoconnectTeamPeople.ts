/**
 * Interface for PCOConnect_Team_People
* Table: PCOConnect_Team_People
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectTeamPeople {

  PCOConnect_Team_Person_ID: number /* 32-bit integer */; // Primary Key

  PCOConnect_Person_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_People.PCOConnect_Person_ID

  PCOConnect_Team_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Teams.PCOConnect_Team_ID

  Person_ID?: number /* 32-bit integer */ | null;

  Team_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  Group_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Group_Participants.Group_Participant_ID

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Date_Archived?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;

  Do_Not_Update_GP?: boolean | null;
}

export type PcoconnectTeamPeopleRecord = PcoconnectTeamPeople;
