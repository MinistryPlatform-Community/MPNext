/**
 * Interface for PCOConnect_Campuses
* Table: PCOConnect_Campuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectCampuses {

  PCOConnect_Campus_ID: number /* 32-bit integer */; // Primary Key

  Campus_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 150 characters
   */
  Campus_Name?: string /* max 150 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectCampusesRecord = PcoconnectCampuses;
