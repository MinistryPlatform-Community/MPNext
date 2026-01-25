/**
 * Interface for vw_mp_Participation_Compliance
* Table: vw_mp_Participation_Compliance
 * Access Level: Read
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface VwMpParticipationCompliance {

  ID?: number /* 64-bit integer */ | null; // Primary Key

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Group_Role_ID: number /* 32-bit integer */; // Foreign Key -> Group_Roles.Group_Role_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

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

export type VwMpParticipationComplianceRecord = VwMpParticipationCompliance;
