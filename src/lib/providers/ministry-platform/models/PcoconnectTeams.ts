/**
 * Interface for PCOConnect_Teams
* Table: PCOConnect_Teams
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectTeams {

  PCOConnect_Team_ID: number /* 32-bit integer */; // Primary Key

  Team_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 150 characters
   */
  Team_Name?: string /* max 150 chars */ | null;

  PCOConnect_Service_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Service_Types.PCOConnect_Service_Type_ID

  Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Date_Archived?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectTeamsRecord = PcoconnectTeams;
