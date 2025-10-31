/**
 * Interface for PCOConnect_Temp_20200325_9
* Table: PCOConnect_Temp_20200325_9
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PcoconnectTemp202003259 {

  PCOConnect_Plan_Time_Person_ID?: number /* 32-bit integer */ | null;

  Start_Date?: string /* ISO datetime */ | null;

  PCOConnect_Plan_ID: number /* 32-bit integer */;

  PCOConnect_Plan_Time_ID: number /* 32-bit integer */;

  PCOConnect_Person_ID?: number /* 32-bit integer */ | null;

  Participant_ID?: number /* 32-bit integer */ | null;

  Date_Updated?: string /* ISO datetime */ | null;

  Event_ID: number /* 32-bit integer */;

  Event_Start_Date: string /* ISO datetime */;

  Event_Participant_ID?: number /* 32-bit integer */ | null;

  Participation_Status_ID?: number /* 32-bit integer */ | null;

  Time_In?: string /* ISO datetime */ | null;

  Group_ID?: number /* 32-bit integer */ | null;

  Group_Participant_ID?: number /* 32-bit integer */ | null;

  Group_Role_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Positions?: string /* max 2147483647 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Statuses?: string /* max 2147483647 chars */ | null;

  PCO_Connect_Mode?: number /* 32-bit integer */ | null;
}

export type PcoconnectTemp202003259Record = PcoconnectTemp202003259;
