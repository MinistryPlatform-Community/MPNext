/**
 * Interface for PCOConnect_Plan_Time_People
* Table: PCOConnect_Plan_Time_People
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectPlanTimePeople {

  PCOConnect_Plan_Time_Person_ID: number /* 32-bit integer */; // Primary Key

  Plan_Time_ID?: number /* 32-bit integer */ | null;

  PCOConnect_Plan_Time_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Plan_Times.PCOConnect_Plan_Time_ID

  Person_ID?: number /* 32-bit integer */ | null;

  PCOConnect_Person_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_People.PCOConnect_Person_ID

  /**
   * Max length: 25 characters
   */
  Status?: string /* max 25 chars */ | null;

  PCOConnect_Team_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Teams.PCOConnect_Team_ID

  /**
   * Max length: 175 characters
   */
  Position?: string /* max 175 chars */ | null;

  Event_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Event_Participants.Event_Participant_ID

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectPlanTimePeopleRecord = PcoconnectPlanTimePeople;
