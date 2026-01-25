/**
 * Interface for vw_mp_Response_Qualification_Details
* Table: vw_mp_Response_Qualification_Details
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMpResponseQualificationDetails {

  ID?: number /* 64-bit integer */ | null; // Primary Key

  Response_ID: number /* 32-bit integer */; // Foreign Key -> Responses.Response_ID

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Background_Check_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Background_Check_Types.Background_Check_Type_ID

  /**
   * Max length: 13 characters
   */
  Background_Check: string /* max 13 chars */;

  Certification_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Certification_Types.Certification_Type_ID

  /**
   * Max length: 13 characters
   */
  Certification: string /* max 13 chars */;

  Milestone_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Milestones.Milestone_ID

  /**
   * Max length: 10 characters
   */
  Milestone: string /* max 10 chars */;

  Custom_Form_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Forms.Form_ID

  /**
   * Max length: 13 characters
   */
  Form: string /* max 13 chars */;
}

export type VwMpResponseQualificationDetailsRecord = VwMpResponseQualificationDetails;
