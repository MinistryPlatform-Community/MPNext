/**
 * Interface for Form_Response_Answers
* Table: Form_Response_Answers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface FormResponseAnswers {

  Form_Response_Answer_ID: number /* 32-bit integer */; // Primary Key

  Form_Field_ID: number /* 32-bit integer */; // Foreign Key -> Form_Fields.Form_Field_ID

  /**
   * Max length: 2147483647 characters
   */
  Response?: string /* max 2147483647 chars */ | null;

  Form_Response_ID: number /* 32-bit integer */; // Foreign Key -> Form_Responses.Form_Response_ID

  Event_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Event_Participants.Event_Participant_ID

  Pledge_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledges.Pledge_ID

  Opportunity_Response?: number /* 32-bit integer */ | null; // Foreign Key -> Responses.Response_ID

  Placed?: boolean | null; // Has Default
}

export type FormResponseAnswersRecord = FormResponseAnswers;
