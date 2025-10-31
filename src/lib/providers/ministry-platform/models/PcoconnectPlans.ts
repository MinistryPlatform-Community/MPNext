/**
 * Interface for PCOConnect_Plans
* Table: PCOConnect_Plans
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectPlans {

  PCOConnect_Plan_ID: number /* 32-bit integer */; // Primary Key

  Plan_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 255 characters
   */
  Plan_Title?: string /* max 255 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Series_Title?: string /* max 255 chars */ | null;

  Plan_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  PCOConnect_Service_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Service_Types.PCOConnect_Service_Type_ID

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectPlansRecord = PcoconnectPlans;
