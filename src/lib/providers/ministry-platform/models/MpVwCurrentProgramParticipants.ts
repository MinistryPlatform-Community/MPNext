/**
 * Interface for mp_vw_Current_Program_Participants
* Table: mp_vw_Current_Program_Participants
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MpVwCurrentProgramParticipants {

  Participant_ID: number /* 32-bit integer */;

  Program_ID: number /* 32-bit integer */;

  Ministry_ID: number /* 32-bit integer */;

  Program_Roles?: number /* 32-bit integer */ | null;

  /**
   * Max length: 11 characters
   */
  Current_Involvement: string /* max 11 chars */;

  Leader_Roles?: number /* 32-bit integer */ | null;

  Servant_Roles?: number /* 32-bit integer */ | null;

  Participant_Roles?: number /* 32-bit integer */ | null;
}

export type MpVwCurrentProgramParticipantsRecord = MpVwCurrentProgramParticipants;
