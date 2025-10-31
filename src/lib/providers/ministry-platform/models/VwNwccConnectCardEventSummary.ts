/**
 * Interface for vw_nwcc_connect_card_event_summary
* Table: vw_nwcc_connect_card_event_summary
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwNwccConnectCardEventSummary {

  Event_ID: number /* 32-bit integer */; // Primary Key

  Event_Start_Date: string /* ISO datetime */;

  /**
   * Max length: 75 characters
   */
  Event_Title: string /* max 75 chars */;

  /**
   * Max length: 50 characters
   */
  Event_Type: string /* max 50 chars */;

  Participants: number /* 32-bit integer */;

  Households: number /* 32-bit integer */;

  Adults: number /* 32-bit integer */;

  Minors: number /* 32-bit integer */;

  Responses: number /* 32-bit integer */;

  Prayer: number /* 32-bit integer */;

  Comment: number /* 32-bit integer */;

  First_Attendance_Ever: number /* 32-bit integer */;

  Second_Attendance_Ever: number /* 32-bit integer */;

  New_Participant_Record: number /* 32-bit integer */;
}

export type VwNwccConnectCardEventSummaryRecord = VwNwccConnectCardEventSummary;
