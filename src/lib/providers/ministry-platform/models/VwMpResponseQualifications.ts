/**
 * Interface for vw_mp_Response_Qualifications
* Table: vw_mp_Response_Qualifications
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMpResponseQualifications {

  ID?: number /* 64-bit integer */ | null; // Primary Key

  Response_ID: number /* 32-bit integer */; // Foreign Key -> Responses.Response_ID

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  /**
   * Max length: 4000 characters
   */
  Attribute_Alignment?: string /* max 4000 chars */ | null;

  /**
   * Max length: 13 characters
   */
  Background_Check?: string /* max 13 chars */ | null;

  /**
   * Max length: 13 characters
   */
  Certification?: string /* max 13 chars */ | null;

  /**
   * Max length: 10 characters
   */
  Milestone?: string /* max 10 chars */ | null;

  /**
   * Max length: 13 characters
   */
  Form?: string /* max 13 chars */ | null;
}

export type VwMpResponseQualificationsRecord = VwMpResponseQualifications;
