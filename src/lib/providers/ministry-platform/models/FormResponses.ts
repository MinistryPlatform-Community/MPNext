/**
 * Interface for Form_Responses
* Table: Form_Responses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface FormResponses {

  Form_Response_ID: number /* 32-bit integer */; // Primary Key

  Form_ID: number /* 32-bit integer */; // Foreign Key -> Forms.Form_ID

  Response_Date: string /* ISO datetime */;

  /**
   * Max length: 45 characters
   */
  IP_Address?: string /* max 45 chars */ | null;

  Contact_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

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
  Email_Address?: string /* email, max 254 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Phone_Number?: string /* max 50 chars */ | null;

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
  Address_City?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Address_State?: string /* max 50 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Address_Zip?: string /* max 25 chars */ | null;

  Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Pledge_Campaign_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID

  Opportunity_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Opportunities.Opportunity_ID

  Opportunity_Response?: number /* 32-bit integer */ | null; // Foreign Key -> Responses.Response_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Notification_Sent: boolean; // Has Default

  Expires?: string /* ISO datetime */ | null;

  Event_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Event_Participants.Event_Participant_ID
}

export type FormResponsesRecord = FormResponses;
