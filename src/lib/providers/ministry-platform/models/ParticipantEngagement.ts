/**
 * Interface for Participant_Engagement
* Table: Participant_Engagement
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ParticipantEngagement {

  Participant_Engagement_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Engagement_Level: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Engagement_Level_Rules?: string /* max 500 chars */ | null;
}

export type ParticipantEngagementRecord = ParticipantEngagement;
