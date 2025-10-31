/**
 * Interface for vw_kpm_FormID726
* Table: vw_kpm_FormID726
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwKpmFormid726 {

  Read_Only_PK: number /* 32-bit integer */; // Primary Key

  Form_Response_ID: number /* 32-bit integer */; // Foreign Key -> Form_Responses.Form_Response_ID

  Event_Participant_ID: number /* 32-bit integer */; // Foreign Key -> Event_Participants.Event_Participant_ID

  /**
   * Max length: 254 characters
   */
  "Agreement 1"?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  "Digital Signature 1"?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  "Relationship to minor"?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  "Agreement 2"?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  "Digital Signature 2"?: string /* max 254 chars */ | null;
}

export type VwKpmFormid726Record = VwKpmFormid726;
