/**
 * Interface for PCOConnect_Plan_Times
* Table: PCOConnect_Plan_Times
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectPlanTimes {

  PCOConnect_Plan_Time_ID: number /* 32-bit integer */; // Primary Key

  Plan_Time_ID?: number /* 32-bit integer */ | null;

  PCOConnect_Plan_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Plans.PCOConnect_Plan_ID

  Plan_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 175 characters
   */
  Plan_Time_Name?: string /* max 175 chars */ | null;

  /**
   * Max length: 175 characters
   */
  Time_Type?: string /* max 175 chars */ | null;

  Start_Date?: string /* ISO datetime */ | null;

  End_Date?: string /* ISO datetime */ | null;

  Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectPlanTimesRecord = PcoconnectPlanTimes;
