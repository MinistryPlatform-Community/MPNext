/**
 * Interface for Participant_Milestones
* Table: Participant_Milestones
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ParticipantMilestones {

  Participant_Milestone_ID: number /* 32-bit integer */; // Primary Key

  Participant_ID: number /* 32-bit integer */; // Foreign Key -> Participants.Participant_ID

  Milestone_ID: number /* 32-bit integer */; // Foreign Key -> Milestones.Milestone_ID

  Program_ID: number /* 32-bit integer */; // Foreign Key -> Programs.Program_ID

  Date_Accomplished?: string /* ISO datetime */ | null;

  Event_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Witness?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  At_Prior_Church: boolean; // Has Default

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  Followed_Up: boolean; // Has Default

  Discontinue_Journey: boolean; // Has Default

  /**
   * Max length: 150 characters
   */
  Performed_By?: string /* max 150 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Place?: string /* max 255 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Sacramental_Name?: string /* max 150 chars */ | null;

  Received: boolean; // Has Default

  Registry_Volume?: number /* 32-bit integer */ | null;

  Registry_Page?: number /* 32-bit integer */ | null;

  Registry_Number?: number /* 32-bit integer */ | null;

  /**
   * Max length: 254 characters
   */
  Witness_1?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Witness_2?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Person_1?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Person_2?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Mother_Name?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Mother_Maiden_Name?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Mother_Religion?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Father_Name?: string /* max 254 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Father_Religion?: string /* max 254 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Name?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Baptism?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Baptism_Church?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Baptism_Street?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Baptism_City?: string /* max 150 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Spouse_Baptism_State?: string /* max 75 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Spouse_Baptism_Zip?: string /* max 75 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Parent_1?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Spouse_Parent_2?: string /* max 150 chars */ | null;
}

export type ParticipantMilestonesRecord = ParticipantMilestones;
