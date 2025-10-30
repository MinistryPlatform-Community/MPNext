/**
 * Interface for Responses
* Table: Responses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Responses {

  Response_ID: number /* 32-bit integer */; // Primary Key

  Response_Date: string /* ISO datetime */;

  Opportunity_ID: number /* 32-bit integer */; // Foreign Key -> Opportunities.Opportunity_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  /**
   * Max length: 2000 characters
   */
  Comments?: string /* max 2000 chars */ | null;

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Email?: string /* max 254 chars */ | null;

  Phone?: string /* phone number */ | null;

  Response_Result_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Response_Results.Response_Result_ID

  Closed: boolean;

  Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Notification_Sent: boolean; // Has Default
}

export type ResponsesRecord = Responses;
