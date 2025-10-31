/**
 * Interface for PCOConnect_People
* Table: PCOConnect_People
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface PcoconnectPeople {

  PCOConnect_Person_ID: number /* 32-bit integer */; // Primary Key

  Person_ID?: number /* 32-bit integer */ | null;

  Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Participants.Participant_ID

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Middle_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  Date_of_Birth?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 15 characters
   */
  Gender?: string /* max 15 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Email_Address?: string /* max 255 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Mobile_Phone?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Home_Phone?: string /* max 25 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Address_Line_1?: string /* max 75 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Address_Line_2?: string /* max 75 chars */ | null;

  /**
   * Max length: 50 characters
   */
  City?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  State_Region?: string /* max 50 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Postal_Code?: string /* max 25 chars */ | null;

  Anniversary_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 50 characters
   */
  Status?: string /* max 50 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Membership?: string /* max 75 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Notes?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 512 characters
   */
  Photo_URL?: string /* max 512 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Permissions?: string /* max 75 chars */ | null;

  Date_Last_Logged_In?: string /* ISO datetime */ | null;

  Date_Created?: string /* ISO datetime */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Date_Refreshed?: string /* ISO datetime */ | null;

  /**
   * Max length: 15 characters
   */
  Child?: string /* max 15 chars */ | null;

  Household_ID?: number /* 32-bit integer */ | null;

  PCOConnect_Campus_ID?: number /* 32-bit integer */ | null; // Foreign Key -> PCOConnect_Campuses.PCOConnect_Campus_ID

  Campus_ID?: number /* 32-bit integer */ | null;

  Date_Inactivated?: string /* ISO datetime */ | null;

  Date_Archived?: string /* ISO datetime */ | null;

  Org_Num?: number /* 32-bit integer */ | null;
}

export type PcoconnectPeopleRecord = PcoconnectPeople;
